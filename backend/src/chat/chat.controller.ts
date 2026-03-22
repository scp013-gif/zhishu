import { Controller, Post, Body, Get, Param, Delete, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt')) // 需登录
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('history')
  async createHistory(@Body() body: { novelId: string; title: string }, @Req() req: any) {
    return this.chatService.createChatHistory(body.novelId, req.user.id, body.title);
  }

  @Get('histories')
  async getHistories(@Req() req: any) {
    return this.chatService.getChatHistories(req.user.id);
  }

  @Delete('history/:id')
  async deleteHistory(@Param('id') id: string, @Req() req: any) {
    return this.chatService.deleteChatHistory(id, req.user.id);
  }

  @Get('messages/:id')
  async getMessages(@Param('id') id: string, @Req() req: any) {
    return this.chatService.getMessages(id, req.user.id);
  }

  @Post('stream')
  async stream(
    @Body() body: { novelId: string; question: string; historyId: string },
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 获取流式响应
      const stream = await this.chatService.streamChat(body.novelId, body.question, body.historyId, req.user.id);
      const reader = stream.getReader();

      // 逐段返回
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (e) {
      res.status(HttpStatus.BAD_REQUEST).write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  }
}