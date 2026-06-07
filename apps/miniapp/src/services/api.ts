import { http } from './http';

export const api = {
  login: (data: { code: string; nickname?: string; avatar?: string }) => http.post('/auth/login', data),
  quests: () => http.get('/quests'),
  quest: (id: number) => http.get(`/quests/${id}`),
  createOrder: (questId: number) => http.post('/orders/create', { questId }),
  mockPay: (orderId: number) => http.post(`/orders/${orderId}/mock-pay`),
  progress: (questId: number) => http.get('/game/progress', { params: { questId } }),
  checkin: (data: { questId: number; nodeId: number; lat: number; lng: number }) => http.post('/game/checkin', data),
  answer: (data: { nodeId: number; answer: string }) => http.post('/game/answer', data),
  photo: (data: { nodeId: number; payload?: string }) => http.post('/game/photo', data),
  qr: (data: { nodeId: number; payload?: string }) => http.post('/game/qr', data),
  finish: (data: { questId: number; duration: number }) => http.post('/game/finish', data),
  finishRecords: () => http.get('/game/finish-records')
};
