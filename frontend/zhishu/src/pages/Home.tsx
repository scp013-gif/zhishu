import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, BookOpen, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import request from '@/api/request';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/plain' && !selectedFile.name.endsWith('.txt') && !selectedFile.name.endsWith('.pdf')) {
        setStatus('error');
        setMessage('仅支持 .txt 或 .pdf 格式的文件');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await request.post('/novel/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
      setMessage('小说上传成功！AI 正在处理内容，稍后即可开始对话。');
      setFile(null);
    } catch (error) {
      console.error('Upload failed', error);
      setStatus('error');
      setMessage('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">开启你的智慧阅读</h1>
        <p className="mt-4 text-lg text-gray-600">上传一本小说，让 AI 陪你深度探讨书中世界</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center space-y-6">
        <div className="bg-primary/10 p-6 rounded-full text-primary">
          <Upload size={48} />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">选择文件</h3>
          <p className="text-gray-500">支持 TXT, PDF 格式 (最大 20MB)</p>
        </div>

        <div className="w-full max-w-xs">
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".txt,.pdf"
            />
            <div className="bg-white border-2 border-primary text-primary hover:bg-primary/5 transition-colors font-semibold py-3 px-6 rounded-lg text-center">
              浏览本地文件
            </div>
          </label>
        </div>

        {file && (
          <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border">
            <FileText size={20} />
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full max-w-xs h-12 text-lg"
        >
          {uploading ? '上传并解析中...' : '开始上传'}
        </Button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-lg animate-in fade-in zoom-in">
            <CheckCircle size={20} />
            <span className="font-medium">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-6 py-3 rounded-lg animate-in fade-in zoom-in">
            <AlertCircle size={20} />
            <span className="font-medium">{message}</span>
          </div>
        )}
      </div>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
          <div className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-lg">
            <BookOpen size={24} />
          </div>
          <h4 className="font-bold">内容解析</h4>
          <p className="text-sm text-gray-500">AI 自动分析小说情节、人物关系和核心思想。</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
          <div className="bg-purple-100 text-purple-600 w-10 h-10 flex items-center justify-center rounded-lg">
            <MessageSquare size={24} />
          </div>
          <h4 className="font-bold">自由对话</h4>
          <p className="text-sm text-gray-500">针对书中任何细节提问，AI 都会给出精准回答。</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
          <div className="bg-green-100 text-green-600 w-10 h-10 flex items-center justify-center rounded-lg">
            <User size={24} />
          </div>
          <h4 className="font-bold">个性化体验</h4>
          <p className="text-sm text-gray-500">保存你的阅读记录，随时回顾之前的精彩探讨。</p>
        </div>
      </section>
    </div>
  );
}
