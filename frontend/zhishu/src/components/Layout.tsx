import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, MessageSquare, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    { path: '/', icon: BookOpen, label: '首页' },
    { path: '/chat', icon: MessageSquare, label: '对话' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white border-r flex flex-col">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-primary hidden md:block">智书 Zhishu</h1>
          <h1 className="text-2xl font-bold text-primary md:hidden">ZS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={24} />
                <span className="hidden md:block font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 p-3 w-full rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={24} />
            <span className="hidden md:block font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
