import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import request from '@/api/request';
import { useAuthStore } from '@/store/useAuthStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthenticated, setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await request.post('/auth/login', { username, password });
      // 后端返回的是 accessToken 和 refreshToken
      localStorage.setItem('access_token', res.accessToken);
      localStorage.setItem('refresh_token', res.refreshToken);
      setUser(res.user);
      setAuthenticated(true);
      navigate('/');
    } catch (error) {
      console.error('Login failed', error);
      alert('登录失败，请检查用户名或密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">欢迎回来</h2>
          <p className="mt-2 text-sm text-gray-600">请登录您的账户以开始讨论书籍</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">用户名</label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label htmlFor="password" title="password" className="block text-sm font-medium text-gray-700">密码</label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="请输入密码"
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </div>
        </form>
        <div className="text-center text-sm">
          <span className="text-gray-600">还没有账号？</span>
          <Link to="/register" className="ml-1 font-medium text-primary hover:underline">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
