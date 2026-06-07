import Taro from '@tarojs/taro';
import axios from 'axios';

export const http = axios.create({
  baseURL: process.env.TARO_APP_API_BASE || 'http://127.0.0.1:3001/api',
  timeout: 10000
});

http.interceptors.request.use((config) => {
  const token = Taro.getStorageSync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
