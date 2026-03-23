import { useState, useCallback } from 'react';
export function useStreamChat() {
  const [loading, setLoading] = useState(false);

  const streamChat = useCallback(async (
    novelId: string, 
    question: string, 
    historyId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: any) => void
  ) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ novelId, question, historyId }),
      });

      if (!response.ok) {
        throw new Error('Streaming failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        // 解析 SSE 数据格式: data: {"content": "..."}
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Parse error', e, data);
            }
          }
        }
      }
      onComplete();
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { streamChat, loading };
}
