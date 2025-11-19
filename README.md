## 包管理

本项目使用 [Bun](https://bun.sh/) 作为包管理器，这是一个快速、现代化的 JavaScript 运行时和包管理器。

详细的包管理指南请参考 [PACKAGE_MANAGEMENT.md](./PACKAGE_MANAGEMENT.md) 文档。

### 安装依赖

```txt
bun install
```

### 开发环境运行

```txt
bun run dev
```

## 部署

```txt
bun run deploy
```

## 类型生成

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
bun run cf-typegen
```

或者直接使用 wrangler 命令：

```txt
wrangler types
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
