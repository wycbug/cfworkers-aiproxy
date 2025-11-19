# Cloudflare Workers AI Proxy

基于 Cloudflare Workers 的 AI API 代理服务，支持多种 AI 提供商，通过 Cloudflare AI Gateway 实现统一的 API 访问、监控和缓存。

## ✨ 功能特性

- 🚀 **多提供商支持** - 支持 OpenAI、Anthropic、Google Gemini、AWS Bedrock 等 20+ AI 提供商
- 🔐 **Pack ID 认证** - 基于 Pack ID 的请求验证，适配 Shortcut 应用
- 🌍 **边缘部署** - 运行在 Cloudflare 全球边缘网络，低延迟高可用
- 📊 **统一监控** - 通过 Cloudflare AI Gateway 统一监控和管理 API 调用
- 🎯 **灵活路由** - 支持 Cloudflare AI Gateway 和自定义提供商 URL
- 💾 **智能缓存** - 利用 Cloudflare 缓存能力降低 API 成本

## 🏗️ 架构

```
Client Request
    ↓
Pack ID Authentication (middleware.ts)
    ↓
Route Analysis (index.ts)
    ↓
    ├─→ Cloudflare AI Gateway → AI Provider
    └─→ Custom Base URL → AI Provider
```

### 两种路由模式

1. **Cloudflare AI Gateway 模式**（默认）
   - 请求通过 Cloudflare AI Gateway 路由
   - 自动映射提供商别名（如 `gemini` → `google-ai-studio`）
   - 路径：`gateway.ai.cloudflare.com/v1/{account}/{gateway}/{provider}`

2. **自定义提供商模式**
   - 请求体中包含 `baseUrl` 字段时启用
   - 直接路由到指定的提供商 URL
   - 支持自建或第三方 API 服务

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh/) - 现代化的 JavaScript 运行时和包管理器
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI
- Cloudflare 账户

### 安装依赖

```bash
bun install
```

### 本地开发

```bash
bun run dev
```

服务将在 `http://localhost:8787` 启动。

### 测试请求

```bash
# 测试 Gemini API（OpenAI 兼容格式）
bash test_request.sh

# 测试 Gemini API（原生格式）
bash test_native_gemini_cf.sh
```

## ⚙️ 配置

### 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
# Cloudflare AI Gateway 配置
CF_ACCOUNT_ID = "your_cloudflare_account_id"
CF_GATEWAY_NAME = "ai-gateway"

# Pack ID 白名单（逗号分隔）
ALLOWED_PACK_IDS = "pack_id_1, pack_id_2, pack_id_3"
```

### 自定义域名

在 `wrangler.toml` 中配置：

```toml
routes = [
  { pattern = "your-domain.com", custom_domain = true }
]
```

## 📡 API 使用

> 📘 **详细文档**: 请查看 [API_USAGE.md](./API_USAGE.md) 获取更完整的 API 调用指南和多厂商示例。

### 基本格式

```
POST /proxy/{provider}/{path}
Headers:
  X-Pack-ID: your_pack_id
  Authorization: Bearer your_api_key
  Content-Type: application/json
```

### 支持的提供商

| 提供商别名 | 映射到 | 示例路径 |
|---------|--------|---------|
| `openai` | openai | `/proxy/openai/v1/chat/completions` |
| `gemini`, `google-gemini` | google-ai-studio | `/proxy/gemini/v1beta/openai/chat/completions` |
| `claude`, `anthropic` | anthropic | `/proxy/claude/v1/messages` |
| `grok`, `xai` | grok | `/proxy/grok/v1/chat/completions` |
| `bedrock`, `aws-bedrock` | aws-bedrock | `/proxy/bedrock/...` |
| `vertex`, `google-vertex` | google-vertex-ai | `/proxy/vertex/...` |
| `groq` | groq | `/proxy/groq/v1/chat/completions` |
| `deepseek` | deepseek | `/proxy/deepseek/v1/chat/completions` |
| `cohere` | cohere | `/proxy/cohere/...` |
| `huggingface`, `hf` | huggingface | `/proxy/hf/...` |
| `mistral` | mistral | `/proxy/mistral/v1/chat/completions` |
| `perplexity` | perplexity | `/proxy/perplexity/...` |

### 示例：使用 Cloudflare AI Gateway

```bash
curl -X POST https://your-domain.com/proxy/gemini/v1beta/openai/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GEMINI_API_KEY" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
```

### 示例：使用自定义 Base URL

```bash
curl -X POST https://your-domain.com/proxy/custom/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Pack-ID: your_pack_id" \
  -d '{
    "baseUrl": "https://api.custom-provider.com",
    "model": "custom-model",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
```

## 🚢 部署

### 部署到 Cloudflare Workers

```bash
bun run deploy
```

### 类型检查

```bash
bun run type-check
```

### 生成 Cloudflare Worker 类型

```bash
bun run cf-typegen
```

## 🛠️ 开发

### 项目结构

```
cfworkers-aiproxy/
├── src/
│   ├── index.ts        # 主应用入口，路由和代理逻辑
│   └── middleware.ts   # Pack ID 认证中间件
├── test_request.sh     # 测试脚本（OpenAI 兼容格式）
├── test_native_gemini_cf.sh  # 测试脚本（Gemini 原生格式）
├── wrangler.toml       # Cloudflare Workers 配置
├── package.json        # 项目依赖
├── tsconfig.json       # TypeScript 配置
└── CLAUDE.md          # Claude Code 开发指南
```

### 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: [Hono](https://hono.dev/) - 轻量级 Web 框架
- **Language**: TypeScript
- **Package Manager**: Bun
- **Deployment**: Wrangler

### 添加新的提供商

在 `src/index.ts` 的 `providerMap` 中添加映射：

```typescript
const providerMap: Record<string, string> = {
  // 添加新提供商
  "new-provider": "cloudflare-gateway-slug",
  // ...
};
```

## 🔒 安全说明

- Pack ID 认证保护所有代理路由
- API 密钥通过 Authorization header 传递，不会被记录
- 敏感的 Cloudflare 头部会在转发前被移除
- 建议配置自定义域名和 HTTPS

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Note**: 本项目使用 [Claude Code](https://claude.com/claude-code) 辅助开发。
