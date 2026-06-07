import axios from 'axios';

export const http = axios.create({
  baseURL: 'http://127.0.0.1:3001/api',
  timeout: 10000
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('cq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getSavedUser() {
  const raw = localStorage.getItem('cq_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('cq_token');
  localStorage.removeItem('cq_user');
}

export async function login(nickname = 'H5 Player') {
  const { data } = await http.post('/auth/login', {
    code: `h5-local-${Date.now()}`,
    nickname,
    avatar: ''
  });
  localStorage.setItem('cq_token', data.token);
  localStorage.setItem('cq_user', JSON.stringify(data.userInfo));
  return data;
}

export async function ensureLogin() {
  const token = localStorage.getItem('cq_token');
  if (token) return token;
  const data = await login();
  return data.token;
}

export const api = {
  quests: () => http.get('/quests'),
  quest: (id: number) => http.get(`/quests/${id}`),
  createOrder: (questId: number) => http.post('/orders/create', { questId }),
  mockPay: (orderId: number) => http.post(`/orders/${orderId}/mock-pay`),
  progress: (questId: number) => http.get('/game/progress', { params: { questId } }),
  startGame: (questId: number) => http.post('/game/start', { questId }),
  photo: (nodeId: number) => http.post('/game/photo', { nodeId, payload: 'h5-photo-mock' }),
  answer: (nodeId: number, answer: string) => http.post('/game/answer', { nodeId, answer }),
  checkin: (questId: number, node: QuestNode) =>
    http.post('/game/checkin', { questId, nodeId: node.id, lat: Number(node.lat), lng: Number(node.lng) }),
  qr: (nodeId: number) => http.post('/game/qr', { nodeId, payload: 'h5-qr-mock' }),
  challenge: (nodeId: number) => http.post('/game/challenge', { nodeId, payload: 'h5-challenge-mock' }),
  finish: (questId: number, duration: number) => http.post('/game/finish', { questId, duration }),
  finishRecords: () => http.get('/game/finish-records'),
  todayEvents: (city = '重庆') => http.get<CityEvent[]>('/events/today', { params: { city } }),
  eventAssignment: (city = '重庆') => http.get<EventAssignment | null>('/events/assignment', { params: { city } }),
  claimEvent: (eventId: number) => http.post<EventAssignment>(`/events/${eventId}/claim`),
  answerEventTask: (taskId: number, answer: string) => http.post(`/events/tasks/${taskId}/answer`, { answer }),
  passEventTask: (taskId: number) => http.post(`/events/tasks/${taskId}/mock-pass`)
};

export interface Quest {
  id: number;
  title: string;
  description: string;
  city: string;
  season: string;
  price: number;
  duration: number;
  distance: number;
  difficulty: string;
  nodes: QuestNode[];
}

export interface QuestNode {
  id: number;
  questId: number;
  nodeIndex: number;
  nodeType: 'gps' | 'qa' | 'photo' | 'qr' | 'challenge' | string;
  title: string;
  content: string;
  lat?: number;
  lng?: number;
  radius?: number;
  answer?: string | null;
  reward?: {
    badge?: string;
    location?: string;
    objective?: string;
    shareTitle?: string;
    hint?: string;
    certificateTitle?: string;
    countdownMinutes?: number;
    npcRole?: string;
    challengeRules?: string[];
    futureVerify?: string;
  };
  nextNode?: number;
}

export interface CityEvent {
  id: number;
  city: string;
  title: string;
  eventType: string;
  rarity: string;
  summary: string;
  reward?: {
    badge?: string;
    treasure?: string;
    shareTitle?: string;
  };
  startsAt: string;
  endsAt: string;
  remainingSeconds: number;
  taskCount: number;
}

export interface EventAssignment {
  id: number;
  status: 'claimed' | 'completed' | string;
  completedAt?: string | null;
  sharePayload?: {
    title?: string;
    subtitle?: string;
    template?: string;
  } | null;
  event: CityEvent;
  task: {
    id: number;
    title: string;
    taskType: 'photo' | 'qa' | 'gps' | 'qr' | 'clue' | string;
    content: string;
    locationName?: string;
    reward?: {
      shareTitle?: string;
      clue?: string;
    };
  };
  role?: {
    id: number;
    code: string;
    name: string;
    description: string;
    ability?: {
      focus?: string;
      shareTag?: string;
    };
  } | null;
}
