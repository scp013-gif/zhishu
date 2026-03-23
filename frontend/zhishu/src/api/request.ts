import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const request = axios.create({
  baseURL: 'http://localhost:3000/api', 
  timeout: 10000,
});

let isRefreshing = false;
let requests: any[] = [];

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const { response, config } = error;
    
    // 如果是 401 错误且不是刷新 token 的请求
    if (response?.status === 401 && config && config.url !== '/auth/refresh') {
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          try {
            const res: any = await axios.post('http://localhost:3000/api/auth/refresh', {
              refresh: refreshToken,
            });
            
            // 后端 refresh 返回的是 { accessToken: '...' }
            const { accessToken } = res.data;
            localStorage.setItem('access_token', accessToken);
            
            isRefreshing = false;
            // 重新发起之前失败的请求
            requests.forEach((cb) => cb(accessToken));
            requests = [];
            
            return request(config);
          } catch (refreshError) {
            isRefreshing = false;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          window.location.href = '/login';
        }
      } else {
        // 正在刷新 token，将请求加入队列
        return new Promise((resolve) => {
          requests.push((token: string) => {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${token}`;
            }
            resolve(request(config));
          });
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default request;
