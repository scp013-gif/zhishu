# 智书 (Zhishu) - AI 驱动的智慧阅读辅助平台

智书 (Zhishu) 是一款基于 **RAG (Retrieval-Augmented Generation)** 架构的智慧阅读辅助工具。它允许用户上传本地小说或文档，通过 AI 深度解析内容，并支持与 AI 就书籍细节、人物关系及核心思想进行实时、精准的流式对话。

---

## 🌟 核心功能

- 📖 **智慧解析**: 支持 TXT、PDF 多格式上传，系统自动进行语义化切片与向量化存储。
- 💬 **RAG 对话**: AI 回答基于书籍原文上下文，有效避免模型幻觉，确保内容准确真实。
- ⚡ **流式响应**: 采用 SSE (Server-Sent Events) 技术，提供毫秒级的打字机式交互体验。
- 🔐 **安全认证**: 完整的 JWT 双 Token (Access & Refresh) 鉴权，配合 Axios 拦截器实现无感刷新。
- 📊 **个人中心**: 数字化管理您的阅读资产，实时记录书籍列表与对话历史。
- 🎨 **极简设计**: 基于 Tailwind CSS 4.0 的现代简约 UI，专注阅读，远离噪音。

---

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**: React 19 (Vite)
- **样式**: Tailwind CSS 4.0 (Utility-First)
- **状态管理**: Zustand
- **路由**: React Router 7 (支持懒加载与守卫)
- **图标/UI**: Lucide React + shadcn/ui 风格

### 后端 (Backend)
- **框架**: NestJS (Node.js)
- **ORM**: Prisma + PostgreSQL
- **向量数据库**: Zilliz Cloud (Milvus)
- **AI 编排**: LangChain
- **大模型**: DeepSeek-Chat

---

## 🏗️ 架构设计

项目遵循标准的 RAG 架构流程：
1. **摄入 (Ingestion)**: 文本提取 -> 语义分块 (Chunking) -> 向量化 (Embedding) -> 存入向量库。
2. **检索 (Retrieval)**: 问题向量化 -> 向量相似度检索 (Cosine Similarity) -> 提取上下文。
3. **生成 (Generation)**: 增强 Prompt -> LLM 推理 -> SSE 流式返回。

---

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/zhishu.git
cd zhishu
```

### 2. 后端配置
```bash
cd backend
npm install
```
在 `backend` 目录下创建 `.env` 文件并配置：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zhishu"
JWT_SECRET="your_jwt_secret"
DEEPSEEK_API_KEY="your_api_key"
ZILLIZ_CLUSTER_URL="your_zilliz_url"
ZILLIZ_TOKEN="your_zilliz_token"
```
运行数据库迁移并启动：
```bash
npx prisma migrate dev
npm run start:dev
```

### 3. 前端配置
```bash
cd ../frontend/zhishu
npm install
npm run dev
```

访问 `http://localhost:5173` 即可开启智慧阅读之旅。

---

