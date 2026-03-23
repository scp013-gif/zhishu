import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovelService } from '../novel/novel.service';
import { createReadStream } from 'fs';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import { ZillizService } from '../zilliz/zilliz.service';

@Injectable()
export class ChatService {
  // 内置的默认日志记录器，它用于在应用程序的生命周期、异常处理以及业务逻辑中输出日志信息。
  private readonly logger = new Logger(ChatService.name);
  private deepSeek: ChatDeepSeek;
  private embeddings: OpenAIEmbeddings; // 向量化模型

  constructor(
    private prisma: PrismaService,
    private novelService: NovelService,
    private zilliz: ZillizService,
    private config: ConfigService,
  ) {
    // 初始化 DeepSeek
    this.deepSeek = new ChatDeepSeek({
      apiKey: this.config.get('DEEPSEEK_API_KEY'),
      streaming: true,
      temperature: 0.5, 
    });

    // 初始化向量化模型
    this.embeddings = new OpenAIEmbeddings({
        apiKey: this.config.get('OPENAI_API_KEY'),
        configuration: {
            baseURL: this.config.get('OPENAI_BASE_URL'),
        },
        modelName: this.config.get('EMBEDDING_MODEL_NAME') || 'text-embedding-v4',
    });
  }

  // 文本向量化
  private async embedText(text: string): Promise<number[]>;
  private async embedText(text: string[]): Promise<number[][]>;
  private async embedText(text: string | string[]): Promise<number[] | number[][]> {
    if (Array.isArray(text)) {
      return this.embeddings.embedDocuments(text);
    } else {
      return this.embeddings.embedQuery(text);
    }
  }

  // 加载小说到 Zilliz（分段 + 向量化 + 插入）
  private async loadNovelToZilliz(novelPath: string, novelId: string) {
    try {
      // 先检查是否已经加载过
      const hasVectors = await this.zilliz.hasNovelVectors(novelId);
      if (hasVectors) {
        this.logger.log(`小说 ${novelId} 已经存在向量，跳过加载`);
        return;
      }

      // 读取小说文本
      const stream = createReadStream(novelPath, 'utf-8');
      let text = '';
      for await (const chunk of stream) text += chunk;

      // 文本分段
      const splitter = new CharacterTextSplitter({
        separator: '\n',
        chunkSize: 500,
        chunkOverlap: 50,
        lengthFunction: (s) => s.length,
      });
      const chunks = await splitter.splitText(text);
      if (chunks.length === 0) throw new BadRequestException('小说文本为空');

      // 向量化 + 插入 Zilliz
      const vectors = await this.embedText(chunks);
      await this.zilliz.insertVectors(vectors, chunks, novelId);
    } catch (e) {
      throw new BadRequestException(`加载小说失败：${e.message}`);
    }
  }

  // 创建聊天会话
  async createChatHistory(novelId: string, userId: string, title: string) {
    await this.novelService.getNovelById(novelId, userId); // 验证权限
    return this.prisma.chatHistory.create({ data: { title, userId, novelId } });
  }

  // 获取会话列表
  async getChatHistories(userId: string) {
    return this.prisma.chatHistory.findMany({
      where: { userId },
      include: { novel: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // 删除会话
  async deleteChatHistory(historyId: string, userId: string) {
    const history = await this.prisma.chatHistory.findFirst({ where: { id: historyId, userId } });
    if (!history) throw new NotFoundException('会话不存在');

    await this.prisma.message.deleteMany({ where: { chatHistoryId: historyId } });
    await this.prisma.chatHistory.delete({ where: { id: historyId } });
    return { success: true };
  }

  // 获取会话消息
  async getMessages(historyId: string, userId: string) {
    await this.prisma.chatHistory.findFirst({ where: { id: historyId, userId } }); // 验证权限
    return this.prisma.message.findMany({ where: { chatHistoryId: historyId }, orderBy: { createdAt: 'asc' } });
  }

  // 流式聊天（核心：RAG + DeepSeek）
  async streamChat(novelId: string, question: string, historyId: string, userId: string) {
    if (!question.trim()) throw new BadRequestException('问题不能为空');

    // 验证会话/小说权限
    const history = await this.prisma.chatHistory.findFirst({ where: { id: historyId, userId, novelId } });
    if (!history) throw new NotFoundException('会话不存在/小说不匹配');

    // 加载小说到 Zilliz
    const novel = await this.novelService.getNovelById(novelId, userId);
    await this.loadNovelToZilliz(novel.filePath, novelId);

    // 问题向量化 + Zilliz 检索相似文本
    const queryVector = await this.embedText(question);
    const relevantTexts = await this.zilliz.searchSimilarVectors(queryVector, novelId, 3);
    const context = relevantTexts.join('\n\n'); // 拼接上下文

    // 保存用户问题
    await this.prisma.message.create({
      data: { content: question, role: 'user', chatHistoryId: historyId },
    });

    // 流式调用 DeepSeek
    const self = this;
    return new Promise<ReadableStream>((resolve) => {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let assistantContent = '';
            const chunks = await self.deepSeek.stream([
              new SystemMessage(`仅基于以下内容回答问题，无相关信息则回答"未找到"：\n${context}`),
              new HumanMessage(question),
            ]);

            for await (const chunk of chunks) {
              if (chunk.content) {
                const content = chunk.content.toString();
                assistantContent += content;
                // 流式返回（SSE 格式）
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }

            // 保存 AI 回答
            await self.prisma.message.create({
              data: { content: assistantContent, role: 'assistant', chatHistoryId: historyId },
            });
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (e) {
            self.logger.error(`流式聊天失败：${e.message}`);
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
            controller.close();
          }
        },
      });
      resolve(stream);
    });
  }
}