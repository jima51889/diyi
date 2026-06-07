export type QuestStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'online' | 'offline' | 'suspended';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type NodeType = 'gps' | 'qa' | 'photo' | 'qr';
export type OrderStatus = 'pending' | 'paid' | 'closed' | 'refunded';
export type ProgressStatus = 'not_started' | 'in_progress' | 'finished';

export interface QuestNode {
  id: number;
  questId: number;
  nodeIndex: number;
  nodeType: NodeType;
  title: string;
  content?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  answer?: string;
  reward?: Record<string, unknown>;
  nextNode?: number;
}

export interface Quest {
  id: number;
  title: string;
  cover?: string;
  description?: string;
  price: number;
  duration: number;
  distance: number;
  difficulty: Difficulty;
  status: QuestStatus;
  nodes?: QuestNode[];
}

export interface UserInfo {
  id: number;
  openid: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
}

export interface GameProgress {
  questId: number;
  currentNode?: number;
  progress: Record<string, unknown>;
  status: ProgressStatus;
}
