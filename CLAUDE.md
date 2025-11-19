# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers AI proxy that routes AI API requests through Cloudflare AI Gateway. It supports multiple AI providers (OpenAI, Anthropic, Google Gemini, etc.) and includes authentication via Pack ID validation for Shortcut app integration.

## Development Commands

```bash
# Install dependencies (uses Bun package manager)
bun install

# Start local development server on localhost:8787
bun run dev

# Type checking
bun run type-check

# Generate/sync Cloudflare Worker types
bun run cf-typegen

# Deploy to Cloudflare Workers
bun run deploy
```

## Architecture

### Core Components

**src/index.ts** - Main application entry point
- Hono-based HTTP server with CORS enabled
- `/proxy/:provider/*` route handles all AI provider proxying
- Two routing modes:
  1. **Cloudflare AI Gateway mode** (default): Routes through `gateway.ai.cloudflare.com/v1/{account}/{gateway}/{provider}`
  2. **Custom provider mode**: Routes directly to user-specified `baseUrl` from request body
- Provider name mapping (e.g., `gemini` → `google-ai-studio`, `claude` → `anthropic`)
- Strips problematic headers (host, cf-*, x-forwarded-*, etc.) before upstream requests

**src/middleware.ts** - Pack ID authentication guard
- `createPackIdGuard()` middleware protects proxy routes
- Validates request Pack ID against `ALLOWED_PACK_IDS` environment variable
- Checks multiple header variants: `X-Pack-ID`, `packID`, `x-pack-id`, `packid`
- Returns 401 for missing/invalid Pack IDs

### Configuration

**wrangler.toml** - Cloudflare Workers configuration
- Custom domain routing: `aiproxy.mediahelper.xyz`
- Environment variables:
  - `CF_ACCOUNT_ID`: Cloudflare account ID for AI Gateway
  - `CF_GATEWAY_NAME`: Gateway name (default: `ai-gateway`)
  - `ALLOWED_PACK_IDS`: Comma-separated list of authorized Pack IDs

### Request Flow

1. Client sends request to `/proxy/{provider}/{path}` with Pack ID header
2. `packIdGuard` middleware validates Pack ID
3. Request body is parsed to check for custom `baseUrl`/`baseurl` field
4. If `baseUrl` present: strips it from body and routes directly to custom URL
5. If no `baseUrl`: maps provider name and routes through Cloudflare AI Gateway
6. Response is streamed back to client with original status and headers

### Testing

Test scripts demonstrate usage patterns:
- `test_request.sh`: Gemini via CF Gateway with OpenAI-compatible endpoint
- `test_native_gemini_cf.sh`: Gemini native API format via CF Gateway

Both require valid Pack ID header for authentication.

## Key Implementation Notes

- Uses Hono v4 web framework optimized for edge workers
- Body stream is only consumed once (for Pack ID validation and custom baseUrl detection)
- Provider mappings support both user-friendly aliases and official CF Gateway slugs
- Custom baseUrl feature allows bypassing CF Gateway for direct provider access
- All proxy routes require Pack ID authentication; health check endpoint (`/`) is public
