import Taro from '@tarojs/taro';
import { create } from 'zustand';
import { api } from '../services/api';

interface UserState {
  token?: string;
  userInfo?: Record<string, unknown>;
  login: () => Promise<void>;
  ensureLogin: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  token: Taro.getStorageSync('token'),
  userInfo: Taro.getStorageSync('userInfo'),
  async login() {
    let code = `local-dev-${Date.now()}`;
    try {
      const loginResult = await Taro.login();
      code = loginResult.code || code;
    } catch {
      code = `local-dev-${Date.now()}`;
    }

    const { data } = await api.login({
      code,
      nickname: 'Local Player',
      avatar: ''
    });

    Taro.setStorageSync('token', data.token);
    Taro.setStorageSync('userInfo', data.userInfo);
    set({ token: data.token, userInfo: data.userInfo });
  },
  async ensureLogin() {
    if (Taro.getStorageSync('token')) {
      return;
    }
    await useUserStore.getState().login();
  }
}));
