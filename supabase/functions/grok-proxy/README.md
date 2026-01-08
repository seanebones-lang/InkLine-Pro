# Grok API Proxy Edge Function

This Supabase Edge Function acts as a secure proxy for the xAI Grok API, providing:

- Authentication verification via Supabase Auth
- API key management (supports white-labeling)
- Usage logging for analytics
- CORS handling
- Streaming response support

## Deployment

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy grok-proxy
```

## Environment Variables

Set these in your Supabase dashboard under Settings > Edge Functions:

- `GROK_API_KEY`: Your xAI Grok API key
- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_ANON_KEY`: Your Supabase anon key (automatically available)

## Usage

The function expects authenticated requests with a valid Supabase session token in the Authorization header.

### Request Format

```json
{
  "model": "grok-beta",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

### Response Format

Same as the Grok API response format.

## White-labeling

To support multiple API keys for different clients, you can:
1. Store API keys in a database table
2. Look up the API key based on the user's organization/client_id
3. Use that key instead of the environment variable
