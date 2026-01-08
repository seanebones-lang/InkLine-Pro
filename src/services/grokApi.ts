import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { requestDeduplication, generateCacheKey } from '../utils/requestDeduplication';

export interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GrokRequestOptions {
  model?: string;
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GrokMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokApiService {
  private baseUrl: string;

  constructor() {
    // Use your Supabase project URL
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    this.baseUrl = `${supabaseUrl}/functions/v1/grok-proxy`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  async chatCompletion(options: GrokRequestOptions): Promise<GrokResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const requestBody = {
        model: options.model || 'grok-beta',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1000,
        stream: options.stream ?? false,
      };
      
      const bodyString = JSON.stringify(requestBody);
      
      // Use request deduplication for non-streaming requests only
      // Streaming requests should not be deduplicated
      const response = options.stream
        ? await fetch(this.baseUrl, {
            method: 'POST',
            headers,
            body: bodyString,
          })
        : await requestDeduplication.deduplicate(
            generateCacheKey(this.baseUrl, 'POST', requestBody),
            async () => {
              return fetch(this.baseUrl, {
                method: 'POST',
                headers,
                body: bodyString,
              });
            }
          );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: GrokResponse = await response.json();
      return data;
    } catch (error) {
      logger.error('Grok API error:', error);
      throw error;
    }
  }

  async *chatCompletionStream(options: GrokRequestOptions): AsyncGenerator<string, void, unknown> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...options,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
              logger.debug('Skipping invalid JSON chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Grok API streaming error:', error);
      throw error;
    }
  }
}

export const grokApi = new GrokApiService();
