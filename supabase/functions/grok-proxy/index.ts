// Updated for 2026 - using latest Deno std library
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROK_API_URL = 'https://api.x.ai/v1';

// CORS configuration - use environment variable for allowed origin in production
const getAllowedOrigin = (): string => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (allowedOrigin) {
    return allowedOrigin;
  }
  // Fallback: Allow all in development (should be restricted in production)
  return Deno.env.get('ENVIRONMENT') === 'production' ? '' : '*';
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const grokRequest: GrokRequest = await req.json();

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
      const errorText = await grokResponse.text();
      return new Response(
        JSON.stringify({ error: 'Grok API error', details: errorText }),
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
    console.error('Error in grok-proxy:', error);
    // Don't expose internal error details in production
    const errorMessage = Deno.env.get('ENVIRONMENT') === 'production'
      ? 'Internal server error'
      : error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
