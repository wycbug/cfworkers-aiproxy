# API 接口使用指南

本文档详细说明了如何调用 Cloudflare Workers AI Proxy 接口，并提供了多种主流 AI 模型的调用示例。

## 🔐 认证与授权

所有请求必须包含以下 Header：

1.  **身份验证**: `X-Pack-ID: <your-pack-id>` (必填，用于通过网关验证)
2.  **API Key**: `Authorization: Bearer <provider-api-key>` (必填，传递给上游服务)
3.  **Content-Type**: `application/json`

## 📡 基础 URL 结构

```
POST https://<your-worker-domain>/proxy/<provider>/<path>
```

-   `provider`: 服务提供商标识 (如 `openai`, `anthropic`, `gemini`, `deepseek`)
-   `path`: 上游 API 的实际路径 (如 `v1/chat/completions`)

---

## 📚 常用厂商调用示例 (Cloudflare Gateway 模式)

以下示例均假设服务运行在 `localhost:8787`，生产环境请替换为实际域名。

### 1. OpenAI

支持官方 OpenAI SDK 格式。

**路径**: `/proxy/openai/v1/chat/completions`

```bash
curl -X POST http://localhost:8787/proxy/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-..." \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "你好，OpenAI！" }
    ]
  }'
```

### 2. Anthropic (Claude)

支持官方 Anthropic 格式。

**路径**: `/proxy/anthropic/v1/messages`

```bash
curl -X POST http://localhost:8787/proxy/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-..." \
  -H "anthropic-version: 2023-06-01" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "claude-3-5-sonnet-20240620",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "你好，Claude！" }
    ]
  }'
```
*注：Anthropic 通常使用 `x-api-key` 而不是 Bearer Token，请根据客户端库调整。Proxy 会透传所有 Headers。*

### 3. Google Gemini

#### 方式 A: 使用 OpenAI 兼容接口 (推荐)
Cloudflare AI Gateway 支持将 Gemini 映射为 OpenAI 格式。

**路径**: `/proxy/gemini/v1beta/openai/chat/completions`

```bash
curl -X POST http://localhost:8787/proxy/gemini/v1beta/openai/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <GEMINI_API_KEY>" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "gemini-1.5-pro",
    "messages": [
      { "role": "user", "content": "你好，Gemini！" }
    ]
  }'
```

#### 方式 B: 使用原生 Gemini API
**路径**: `/proxy/gemini/v1beta/models/gemini-1.5-flash:generateContent`

```bash
curl -X POST "http://localhost:8787/proxy/gemini/v1beta/models/gemini-1.5-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: <GEMINI_API_KEY>" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "contents": [{
      "parts": [{"text": "你好，Gemini！"}]
    }]
  }'
```

### 4. DeepSeek (深度求索)

**路径**: `/proxy/deepseek/v1/chat/completions`

```bash
curl -X POST http://localhost:8787/proxy/deepseek/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <DEEPSEEK_API_KEY>" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      { "role": "user", "content": "你好，DeepSeek！" }
    ]
  }'
```

### 5. Groq

**路径**: `/proxy/groq/v1/chat/completions`

```bash
curl -X POST http://localhost:8787/proxy/groq/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <GROQ_API_KEY>" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "llama3-8b-8192",
    "messages": [
      { "role": "user", "content": "你好，Groq！" }
    ]
  }'
```

### 6. Mistral AI

**路径**: `/proxy/mistral/v1/chat/completions`

```bash
curl -X POST http://localhost:8787/proxy/mistral/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <MISTRAL_API_KEY>" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "mistral-large-latest",
    "messages": [
      { "role": "user", "content": "你好，Mistral！" }
    ]
  }'
```

---

## 🛠 自定义上游模式 (Bypass Mode)

如果你需要访问 Cloudflare AI Gateway 不支持的提供商，或者需要直连私有部署的模型，可以使用 `baseUrl` 参数。

当请求体中包含 `baseUrl` 字段时：
1.  Proxy 会忽略路径中的 provider 部分。
2.  直接将请求转发到 `baseUrl` + `path`。
3.  转发前会自动从 Body 中移除 `baseUrl` 和 `apiType` 字段。

### 示例：连接本地 Ollama 或其他私有服务

假设你想通过 Proxy 访问一个不在列表中的服务，或者想动态指定上游地址。

**请求路径**: `/proxy/custom/v1/chat/completions` (这里的 `custom` 可以是任意字符串)

**Body 参数**:
-   `baseUrl`: 目标服务的 API 根地址 (如 `https://api.moonshot.cn`)
-   `apiType`: (可选) 标识 API 类型，默认为 `openai`

```bash
curl -X POST http://localhost:8787/proxy/custom/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_KEY>" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "baseUrl": "https://api.moonshot.cn", 
    "model": "moonshot-v1-8k",
    "messages": [
      { "role": "user", "content": "你好，Kimi！" }
    ]
  }'
```

**处理逻辑**:
Worker 会将上述请求转发至: `https://api.moonshot.cn/v1/chat/completions`

---

## 📋 支持的 Provider 映射表

当不使用 `baseUrl` 时，路径中的 provider 会被映射到 Cloudflare AI Gateway 的对应 ID：

| URL Provider | Cloudflare Gateway ID | 备注 |
| :--- | :--- | :--- |
| `openai` | `openai` | |
| `azure`, `azure-openai` | `azure-openai` | |
| `anthropic`, `claude` | `anthropic` | |
| `gemini`, `google-gemini` | `google-ai-studio` | |
| `vertex`, `google-vertex` | `google-vertex-ai` | |
| `deepseek` | `deepseek` | |
| `groq` | `groq` | |
| `mistral` | `mistral` | |
| `bedrock`, `aws-bedrock` | `aws-bedrock` | |
| `huggingface`, `hf` | `huggingface` | |
| `perplexity` | `perplexity` | |
| `cohere` | `cohere` | |
| `grok`, `xai` | `grok` | |
| `openrouter` | `openrouter` | |
