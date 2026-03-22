import { create } from 'zustand';

interface ChatHistory {
  id: string;
  title: string;
  novelId: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatState {
  histories: ChatHistory[];
  currentHistoryId: string | null;
  messages: Message[];
  setHistories: (histories: ChatHistory[]) => void;
  setCurrentHistoryId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  histories: [],
  currentHistoryId: null,
  messages: [],
  setHistories: (histories) => set({ histories }),
  setCurrentHistoryId: (id) => set({ currentHistoryId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
