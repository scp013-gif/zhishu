import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageCircle, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import request from '@/api/request';
import { useChatStore } from '@/store/useChatStore';
import { useStreamChat } from '@/hooks/useStreamChat';

export default function Chat() {
  const [novels, setNovels] = useState<any[]>([]);
  const [selectedNovelId, setSelectedNovelId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  const { histories, currentHistoryId, messages, setHistories, setCurrentHistoryId, setMessages, addMessage } = useChatStore();
  const { streamChat } = useStreamChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    fetchNovels();
    fetchHistories();
  }, []);

  useEffect(() => {
    if (currentHistoryId) {
      fetchMessages(currentHistoryId);
    } else {
      setMessages([]);
    }
  }, [currentHistoryId]);

  const fetchNovels = async () => {
    try {
      const res: any = await request.get('/novel/list');
      setNovels(res);
      if (res.length > 0 && !selectedNovelId) {
        setSelectedNovelId(res[0].id);
      }
    } catch (error) {
      console.error('Fetch novels failed', error);
    }
  };

  const fetchHistories = async () => {
    try {
      const res: any = await request.get('/chat/histories');
      setHistories(res);
    } catch (error) {
      console.error('Fetch histories failed', error);
    }
  };

  const fetchMessages = async (historyId: string) => {
    try {
      const res: any = await request.get(`/chat/messages/${historyId}`);
      setMessages(res);
    } catch (error) {
      console.error('Fetch messages failed', error);
    }
  };

  const createNewHistory = async () => {
    if (!selectedNovelId) return;
    const novel = novels.find(n => n.id === selectedNovelId);
    if (!novel) return;
    try {
      const res: any = await request.post('/chat/history', {
        novelId: selectedNovelId,
        title: `与《${novel.name}》的对话`,
      });
      setHistories([res, ...histories]);
      setCurrentHistoryId(res.id);
    } catch (error) {
      console.error('Create history failed', error);
    }
  };

  const deleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await request.delete(`/chat/history/${id}`);
      setHistories(histories.filter(h => h.id !== id));
      if (currentHistoryId === id) {
        setCurrentHistoryId(null);
      }
    } catch (error) {
      console.error('Delete history failed', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedNovelId || isStreaming) return;

    let historyId = currentHistoryId;
    if (!historyId) {
      // 如果没有选择历史，先创建一个
      const novel = novels.find(n => n.id === selectedNovelId);
      if (!novel) return;
      const res: any = await request.post('/chat/history', {
        novelId: selectedNovelId,
        title: `与《${novel.name}》的对话`,
      });
      setHistories([res, ...histories]);
      setCurrentHistoryId(res.id);
      historyId = res.id;
    }

    const question = inputValue.trim();
    setInputValue('');
    
    // 添加用户消息
    const userMsg: any = { id: Date.now().toString(), role: 'user', content: question, createdAt: new Date().toISOString() };
    addMessage(userMsg);

    setIsStreaming(true);
    setStreamingContent('');

    await streamChat(
      selectedNovelId,
      question,
      historyId!,
      (chunk) => {
        setStreamingContent(prev => prev + chunk);
      },
      () => {
        // 完成后将流式内容添加为一条正式消息
        const assistantMsg: any = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: streamingContent, 
          createdAt: new Date().toISOString() 
        };
        // 这里需要从后端重新获取一下消息列表以确保同步，或者手动把 streamingContent 加进去
        // 为了简单，我们直接重新拉取一次
        fetchMessages(historyId!);
        setIsStreaming(false);
        setStreamingContent('');
      },
      (error) => {
        console.error('Stream error', error);
        setIsStreaming(false);
      }
    );
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* History Sidebar */}
      <div className="w-80 border-r flex flex-col bg-gray-50/50">
        <div className="p-4 border-b space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">选择书籍</label>
            <select
              value={selectedNovelId}
              onChange={(e) => setSelectedNovelId(e.target.value)}
              className="w-full p-2 rounded-lg border bg-white shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="" disabled>选择要讨论的小说</option>
              {novels.map((novel) => (
                <option key={novel.id} value={novel.id}>{novel.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={createNewHistory} className="w-full flex gap-2">
            <Plus size={18} /> 新建对话
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {histories.map((history) => (
            <div
              key={history.id}
              onClick={() => setCurrentHistoryId(history.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                currentHistoryId === history.id 
                  ? 'bg-white shadow-md border-primary/20 border text-primary' 
                  : 'hover:bg-white hover:shadow-sm text-gray-600'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageCircle size={18} className={currentHistoryId === history.id ? 'text-primary' : 'text-gray-400'} />
                <span className="truncate text-sm font-medium">{history.title}</span>
              </div>
              <button
                onClick={(e) => deleteHistory(e, history.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {histories.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              暂无历史记录
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {!currentHistoryId && messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-primary/5 p-8 rounded-full">
              <Bot size={64} className="text-primary animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-bold">开始与 AI 聊聊你的书</h2>
              <p className="text-gray-500">
                选择左侧书籍或历史记录，AI 将基于书籍内容回答你的任何疑问。
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-100 text-gray-800 shadow-sm rounded-tl-none border-l-4 border-primary/30">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {streamingContent}
                        <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t bg-white">
              <div className="max-w-4xl mx-auto flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="询问书籍相关内容..."
                  className="h-12 text-lg px-4"
                  disabled={isStreaming}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!inputValue.trim() || isStreaming || !selectedNovelId}
                  className="h-12 w-12 rounded-full p-0 flex items-center justify-center"
                >
                  <Send size={20} />
                </Button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                AI 可能产生误导，请核对重要信息。
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
