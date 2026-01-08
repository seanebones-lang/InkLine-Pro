import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROK_API_URL = 'https://api.x.ai/v1';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrokRequest {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
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
      await supabaseClient
        .from('grok_usage_logs')
        .insert({
          user_id: user.id,
          request_tokens: grokRequest.messages.reduce((acc, msg) => acc + msg.content.length, 0),
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
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
