#!/bin/bash
curl -X POST http://localhost:8787/proxy/gemini/v1beta/openai/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AIzaSyDfJnq9ueYTx_vmIKv_KULrGevterpXguo" \
  -H "X-Pack-ID: replit_3f0a2cf4dcf163fb" \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [
      {
        "role": "user",
        "content": "Hello via Cloudflare Gateway!"
      }
    ]
  }'