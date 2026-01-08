// Updated for 2026 - using latest Deno std library
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROK_API_URL = 'https://api.x.ai/v1';

// CORS configuration - SECURITY: Never allow wildcard in production
// Compliant with OWASP Top 10 2025 and NIST SP 800-53 Rev. 5
const getAllowedOrigin = (): string => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (allowedOrigin) {
    return allowedOrigin;
  }
  // SECURITY: Never allow wildcard, even in development
  // Default to empty string which will reject CORS requests
  // Must set ALLOWED_ORIGIN environment variable
  return '';
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window per user
const ENDPOINT = 'grok-proxy';

// Check rate limit for user using Supabase (persistent across restarts)
async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
    
    // Clean up expired entries
    await supabaseClient
      .from('rate_limits')
      .delete()
      .lt('window_end', windowStart.toISOString());
    
    // Get current rate limit for user
    const { data: existingLimit, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', ENDPOINT)
      .gte('window_end', now.toISOString())
      .order('window_end', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking rate limit:', fetchError);
      // On error, allow request (fail open for reliability)
      return true;
    }
    
    if (!existingLimit) {
      // No existing limit, create new window
      const windowEnd = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
      const { error: insertError } = await supabaseClient
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint: ENDPOINT,
          request_count: 1,
          window_start: now.toISOString(),
          window_end: windowEnd.toISOString(),
        });
      
      if (insertError) {
        console.error('Error creating rate limit:', insertError);
        return true; // Fail open
      }
      
      return true;
    }
    
    // Check if limit exceeded
    if (existingLimit.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    // Increment count
    const { error: updateError } = await supabaseClient
      .from('rate_limits')
      .update({
        request_count: existingLimit.request_count + 1,
        updated_at: now.toISOString(),
      })
      .eq('id', existingLimit.id);
    
    if (updateError) {
      console.error('Error updating rate limit:', updateError);
      return true; // Fail open
    }
    
    return true;
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    // Fail open for reliability
    return true;
  }
}

// Input sanitization
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and dangerous characters
  let sanitized = input.replace(/\0/g, '');
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.trim();
  
  // Limit length
  const MAX_LENGTH = 50000; // Reasonable limit for API requests
  if (sanitized.length > MAX_LENGTH) {
    return sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

// Sanitize messages in request
function sanitizeMessages(messages: GrokRequest['messages']): GrokRequest['messages'] {
  return messages.map((msg) => {
    if (typeof msg.content === 'string') {
      return {
        ...msg,
        content: sanitizeInput(msg.content),
      };
    } else if (Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((item) => {
          if (item.type === 'text' && item.text) {
            return {
              ...item,
              text: sanitizeInput(item.text),
            };
          }
          return item;
        }),
      };
    }
    return msg;
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

interface GrokRequest {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting check (using Supabase for persistence)
    if (!(await checkRateLimit(supabaseClient, user.id))) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }

    // Get Grok API key from environment or database (white-labeling)
    // For now, using environment variable. In production, you might want to
    // store this in a database table for white-labeling different clients
    const grokApiKey = Deno.env.get('GROK_API_KEY');
    if (!grokApiKey) {
      return new Response(
        JSON.stringify({ error: 'Grok API key not configured' }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get request body
    const rawBody = await req.json();
    
    // Validate request size (prevent DoS)
    const bodySize = JSON.stringify(rawBody).length;
    const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
    if (bodySize > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        {
          status: 413,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Sanitize input
    const grokRequest: GrokRequest = {
      ...rawBody,
      messages: sanitizeMessages(rawBody.messages || []),
    };

    // Make request to Grok API
    const grokResponse = await fetch(`${GROK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: grokRequest.model || 'grok-beta',
        messages: grokRequest.messages,
        temperature: grokRequest.temperature || 0.7,
        max_tokens: grokRequest.max_tokens || 1000,
        stream: grokRequest.stream || false,
      }),
    });

    if (!grokResponse.ok) {
      // SECURITY: Don't expose internal error details in production
      const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
      const errorText = await grokResponse.text();
      
      return new Response(
        JSON.stringify({
          error: 'API request failed',
          ...(isProduction ? {} : { details: errorText }),
        }),
        {
          status: grokResponse.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle streaming response
    if (grokRequest.stream) {
      return new Response(grokResponse.body, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular response
    const responseData = await grokResponse.json();

    // Log usage for analytics (optional)
    try {
      const requestTokens = grokRequest.messages.reduce((acc, msg) => {
        if (typeof msg.content === 'string') {
          return acc + msg.content.length;
        } else {
          // For vision API, estimate tokens from text content
          return acc + msg.content.reduce((sum, item) => {
            return sum + (item.text?.length || 0) + (item.image_url ? 100 : 0); // Estimate image tokens
          }, 0);
        }
      }, 0);
      
      await supabaseClient
        .from('grok_usage_logs')
        .insert({
          user_id: user.id,
          request_tokens: requestTokens,
          response_tokens: JSON.stringify(responseData).length,
          created_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('Error logging usage:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // SECURITY: Never expose internal error details in production
    // Log error server-side only
    console.error('Error in grok-proxy:', error);
    
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        ...(isProduction ? {} : { message: error instanceof Error ? error.message : 'Unknown error' }),
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
