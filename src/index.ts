import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { createPackIdGuard } from "./middleware";

const app = new Hono();

app.use("*", cors());

// Apply PackID Guard to proxy routes
// This ensures only authorized Shortcut users can access the proxy
app.use("/proxy/*", createPackIdGuard());

// AI Gateway Proxy Route
app.all("/proxy/:provider/*", async (c) => {
  const provider = c.req.param("provider");
  
  // Extract the path after /proxy/:provider
  const url = new URL(c.req.url);
  const pathParts = url.pathname.split("/");
  // pathParts: ['', 'proxy', 'openai', 'v1', 'chat', 'completions']
  // We want from index 3 onwards
  const proxyPath = "/" + pathParts.slice(3).join("/");

  // Handle Body and Check for Base URL
  const method = c.req.method;
  const contentType = c.req.header("content-type");
  
  let requestBody: string | undefined;
  let parsedBody: any = {};
  let customBaseUrl: string | undefined;

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    try {
      requestBody = await c.req.text();
      if (contentType?.includes("application/json") && requestBody) {
        parsedBody = JSON.parse(requestBody);
        customBaseUrl = parsedBody.baseUrl || parsedBody.baseurl;
      }
    } catch (e) {
      console.error("Error parsing request body:", e);
    }
  }

  // Determine API Type (default to openai) - currently mainly for context/future use
  const apiType = parsedBody?.apiType || parsedBody?.apitype || "openai";

  let upstreamUrl: string;
  let finalBody: BodyInit | null | undefined;

  if (customBaseUrl) {
    // Case 1: Custom Provider (Client provided baseUrl)
    
    // Clean up body: remove baseUrl/baseurl and apiType/apitype to avoid sending it upstream
    if (parsedBody.baseUrl) delete parsedBody.baseUrl;
    if (parsedBody.baseurl) delete parsedBody.baseurl;
    if (parsedBody.apiType) delete parsedBody.apiType;
    if (parsedBody.apitype) delete parsedBody.apitype;
    
    finalBody = JSON.stringify(parsedBody);

    // Construct Upstream URL
    // Ensure customBaseUrl doesn't have trailing slash
    const cleanBaseUrl = customBaseUrl.replace(/\/$/, "");
    upstreamUrl = `${cleanBaseUrl}${proxyPath}${url.search}`;

  } else {
    // Case 2: Cloudflare AI Gateway (Default)

    // Get environment variables
    const { CF_ACCOUNT_ID, CF_GATEWAY_NAME } = env<{
      CF_ACCOUNT_ID: string;
      CF_GATEWAY_NAME: string;
    }>(c);

    if (!CF_ACCOUNT_ID || !CF_GATEWAY_NAME) {
      return c.json(
        {
          error:
            "Missing Cloudflare AI Gateway configuration (CF_ACCOUNT_ID or CF_GATEWAY_NAME)",
        },
        500
      );
    }

    // Map user-friendly provider names to Cloudflare AI Gateway provider slugs
    // See: https://developers.cloudflare.com/ai-gateway/providers/
    let targetProvider = provider;
    const providerMap: Record<string, string> = {
      // Google
      "google-gemini": "google-ai-studio",
      "gemini": "google-ai-studio",
      "google-vertex": "google-vertex-ai",
      "vertex": "google-vertex-ai",
      
      // AWS
      "bedrock": "aws-bedrock",
      "aws-bedrock": "aws-bedrock",
      
      // Anthropic
      "anthropic": "anthropic",
      "claude": "anthropic",
      
      // OpenAI & Azure
      "openai": "openai",
      "azure": "azure-openai",
      "azure-openai": "azure-openai",
      
      // Others
      "xai": "grok",
      "grok": "grok",
      "huggingface": "huggingface",
      "hf": "huggingface",
      "mistral": "mistral",
      "groq": "groq",
      "deepseek": "deepseek",
      "cohere": "cohere",
      "openrouter": "openrouter",
      "perplexity": "perplexity",
      "replicate": "replicate",
      "workers-ai": "workers-ai",
      "elevenlabs": "elevenlabs",
      "fal": "fal", 
      "fal-ai": "fal",
    };

    if (providerMap[provider]) {
      targetProvider = providerMap[provider];
    }

    // Construct Upstream URL
    upstreamUrl = `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_GATEWAY_NAME}/${targetProvider}${proxyPath}${url.search}`;
    
    // Use the read body text if available
    finalBody = requestBody;
  }

  // Forward the request
  const headers = new Headers(c.req.raw.headers);

  // Remove headers that might interfere with the upstream request
  const headersToRemove = [
    "host",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-visitor",
    "x-forwarded-proto",
    "x-real-ip",
    "x-forwarded-for",
    "content-length",
  ];
  headersToRemove.forEach((h) => headers.delete(h));

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers,
      body: finalBody,
      redirect: "follow",
    });

    // Create a new response to return to the client
    const newHeaders = new Headers(response.headers);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: `Upstream request failed: ${errorMessage}` }, 502);
  }
});

// Health Check
app.get("/", (c) => {
  return c.json({
    message: "AI Gateway Proxy is running",
    status: "ok",
    version: "1.0.0"
  });
});

export default app;
