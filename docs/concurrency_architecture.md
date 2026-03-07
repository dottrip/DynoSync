# DynoSync 并发架构演进计划

> 本文档记录 DynoSync 从当前架构到高并发场景的全面扩展路线图。

## 当前技术栈

| 组件 | 技术选型 | 部署平台 |
|---|---|---|
| 后端 API | Hono (TypeScript) | Cloudflare Workers |
| 数据库 | PostgreSQL | Supabase |
| ORM | Prisma | — |
| 存储 | Supabase Storage | CDN 自带 |
| 认证 | Supabase Auth | — |
| AI 引擎 | Google Gemini (Flash / Pro) | API 调用 |
| 前端 | React Native + Expo | iOS / Android |

---

## 阶段一：前期优化（当前 → 1万用户）

### 1. AI 请求限流 (Rate Limiting)

**瓶颈分析**：AI Advisor 调用 Gemini API 是整个系统中最昂贵、最慢的操作。当前仅有月度信用额度（Credits）控制，缺少请求级别的流量保护。

**方案**：在 Hono 中间件层加入基于内存的滑动窗口限流器。

- 按用户 ID 限制：每分钟最多 5 次 AI 请求
- 按全局限制：每秒最多 20 次 AI 请求（保护 Gemini API 配额）
- 返回 `429 Too Many Requests` 和 `Retry-After` 头
- 文件：`packages/api/src/middleware/rateLimit.ts`（新建）
- 文件：`packages/api/src/routes/ai.ts`（接入中间件）

### 2. 图片压缩与缩略图

**瓶颈分析**：用户上传车辆照片时直接以 0.8 质量上传原图，无尺寸限制。列表页和网格卡片加载完整大图，浪费大量带宽。

**方案**：在客户端上传前使用 `expo-image-manipulator` 压缩并生成缩略图。

- 上传前自动将图片缩放至最大宽度 1200px（主图）
- 同时生成 400px 宽度的缩略图版本并上传
- 车库网格页加载缩略图 (`image_thumb_url`)，详情页加载主图
- 文件：`apps/mobile/hooks/useImagePicker.ts`（添加压缩逻辑）
- 文件：`packages/db/prisma/schema.prisma`（Vehicle 表增加 `image_thumb_url` 字段）
- 文件：需要新建数据库迁移 SQL

### 3. 数据库索引审查与优化

**瓶颈分析**：随着数据量增长，缺少适当索引将导致全表扫描。

**当前索引状态**：
| 表 | 已有索引 | 缺失索引 |
|---|---|---|
| `vehicles` | `user_id`, `(user_id, is_archived)` | ✅ 已覆盖 |
| `dyno_records` | `vehicle_id`, `(vehicle_id, recorded_at)` | ✅ 已覆盖 |
| `mod_logs` | `vehicle_id`, `(vehicle_id, installed_at)` | ✅ 已覆盖 |
| `advisor_logs` | `vehicle_id` | ❌ 缺少 `user_id` 索引 |
| `ai_credit_logs` | `user_id`, `created_at`（单独） | ❌ 缺少 `(user_id, created_at)` 复合索引 |
| `build_follows` | `user_id`, `vehicle_id` | ✅ 已覆盖 |

**方案**：添加缺失的关键索引。

- `advisor_logs` 加 `user_id` 索引（用于用户历史查询）
- `ai_credit_logs` 加 `(user_id, created_at)` 复合索引（用于月度信用额度计算）
- 文件：新建迁移 `packages/db/migrations/add_performance_indexes.sql`
- 文件：`packages/db/prisma/schema.prisma`（同步索引声明）

---

## 阶段二：中期扩展（1万 → 10万用户）

### 4. API 全局速率限制

- 基于 Cloudflare Workers KV 的全局限流
- 为所有路由添加通用的请求频率守护

### 5. 数据库连接池优化

- Supabase Pro 内置 PgBouncer，确保连接数不会被打满
- 考虑将热数据查询迁移至 Supabase Edge Functions

### 6. 图片 CDN 迁移

- 从 Supabase Storage 迁移至 Cloudflare R2 + Images
- 利用 Cloudflare Images 的 Variants 自动生成多尺寸图片

### 7. 缓存层

- 使用 Cloudflare KV 缓存排行榜、公开车辆资料等读密集型数据
- AI 结果进一步缓存热门车型的通用分析

---

## 阶段三：远期演进（10万+ 用户）

### 8. 微服务拆分

```
┌─────────────────┐
│   API Gateway    │  ← 统一入口、认证、限流
├────────┬────────┤
│  Auth  │Vehicle │  ← 各自独立扩缩容
│Service │Service │
├────────┼────────┤
│   AI   │  Dyno  │
│Service │Service │
└────────┴────────┘
```

### 9. 全球化部署

- 多区域 Edge Functions
- 按用户地理位置就近路由

### 10. 数据治理

- 历史 Dyno 数据归档至低成本存储
- AI 训练数据管道

---

## 优先级排序

| 优先级 | 项目 | 预计工作量 | 影响范围 |
|:---:|---|---|---|
| 🔴 P0 | AI 请求限流 | 1-2h | 成本控制 + 服务稳定性 |
| 🟡 P1 | 图片压缩与缩略图 | 2-3h | 带宽节省 + 加载速度 |
| 🟡 P1 | 数据库索引优化 | 0.5h | 查询性能 |
| 🟢 P2 | 全局 KV 限流 | 阶段二 | 服务稳定性 |
| 🟢 P2 | CDN 迁移 | 阶段二 | 图片分发 |
| 🔵 P3 | 微服务拆分 | 阶段三 | 全面扩展 |
