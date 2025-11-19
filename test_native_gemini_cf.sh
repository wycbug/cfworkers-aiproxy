#!/bin/bash
curl -X POST http://localhost:8787/proxy/gemini/v1/models/gemini-1.5-flash:generateContent \
  -H "Content-Type: application/json"   -H "x-goog-api-key: AIzaSyDfJnq9ueYTx_vmIKv_KULrGevterpXguo"   -H "X-Pack-ID: replit_3f0a2cf4dcf163fb"   -d '{
    "contents": [
      {
        "parts": [
          {"text": "Hello from Cloudflare Native!"}
        ]
      }
    ]
  }'
