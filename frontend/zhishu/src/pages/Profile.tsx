import { useState, useEffect } from 'react';
import { User, Book, Trash2, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import request from '@/api/request';
import { useAuthStore } from '@/store/useAuthStore';

export default function Profile() {
  const [novels, setNovels] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      const res: any = await request.get('/novel/list');
      setNovels(res);
    } catch (error) {
      console.error('Fetch novels failed', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNovel = async (id: string) => {
    if (!confirm('确定要删除这本书吗？相关的对话历史也将无法使用。')) return;
    try {
      await request.delete(`/novel/${id}`);
      setNovels(novels.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Delete novel failed', error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* User Info Header */}
      <section className="bg-white rounded-2xl p-8 shadow-sm border flex items-center gap-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-md">
          <User size={48} />
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">{user?.username || '用户'}</h2>
          <p className="text-gray-500 flex items-center gap-2">
            <Calendar size={16} />
            智书会员 · 2026年加入
          </p>
        </div>
      </section>

      {/* Uploaded Books List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Book className="text-primary" />
            我上传的书籍
          </h3>
          <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            共 {novels.length} 本
          </span>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : novels.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {novels.map((novel) => (
              <div key={novel.id} className="group bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-gray-400 group-hover:text-primary transition-colors">
                    <FileText size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{novel.name}</h4>
                    <p className="text-sm text-gray-500">上传于: {new Date(novel.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">ID: {novel.id.substring(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteNovel(novel.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="删除书籍"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-12 text-center space-y-4">
            <p className="text-gray-500">你还没有上传过任何书籍</p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              立即去上传
            </Button>
          </div>
        )}
      </section>

      {/* Stats or other info */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-2">
          <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">对话次数</p>
          <p className="text-3xl font-bold text-blue-900">128</p>
        </div>
        <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100 space-y-2">
          <p className="text-sm text-purple-600 font-medium uppercase tracking-wider">分析字数</p>
          <p className="text-3xl font-bold text-purple-900">1.2M</p>
        </div>
        <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 space-y-2">
          <p className="text-sm text-green-600 font-medium uppercase tracking-wider">阅读时长</p>
          <p className="text-3xl font-bold text-green-900">42h</p>
        </div>
      </section>
    </div>
  );
}
