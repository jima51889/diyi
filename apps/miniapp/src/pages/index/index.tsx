import { Button } from '@nutui/nutui-react-taro';
import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import questCover from '../../assets/chongqing-letter-cover.jpg';
import { api } from '../../services/api';
import { useUserStore } from '../../store/user';
import './index.scss';

interface QuestCard {
  id: number;
  title: string;
  cover?: string;
  description?: string;
  price: number;
  duration: number;
  distance: number;
  difficulty: string;
}

const s1Quest = {
  title: '山城迷城计划：消失的山城核心',
  description: '成为山城调查局调查员，在重庆真实街巷里追踪失踪八十余年的档案。',
  cover: questCover,
  difficulty: '进阶',
  duration: 180,
  distance: 5.8
};

function normalizeQuest(quest: QuestCard): QuestCard {
  if (quest.id !== 1) return quest;
  return {
    ...quest,
    title: s1Quest.title,
    description: s1Quest.description,
    cover: s1Quest.cover,
    difficulty: s1Quest.difficulty,
    duration: s1Quest.duration,
    distance: s1Quest.distance
  };
}

export default function IndexPage() {
  const ensureLogin = useUserStore((state) => state.ensureLogin);
  const [quests, setQuests] = useState<QuestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>();

  useEffect(() => {
    const load = async () => {
      try {
        const questRes = await api.quests();
        const nextQuests = questRes.data.map(normalizeQuest);
        setQuests(nextQuests);

        if (nextQuests[0]) {
          await ensureLogin();
          const progressRes = await api.progress(nextQuests[0].id);
          setProgress(progressRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ensureLogin]);

  const featuredQuest = useMemo(() => quests[0], [quests]);
  const hasStarted = progress?.status === 'in_progress' || progress?.status === 'finished';

  const openDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/quest/detail/index?id=${id}` });
  };

  const startFeatured = async (event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.();
    if (!featuredQuest) return;
    await ensureLogin();
    Taro.navigateTo({ url: `/pages/game/index?questId=${featuredQuest.id}` });
  };

  return (
    <View className='page home'>
      <View className='home-hero'>
        <Image className='hero-image' mode='aspectFill' src={questCover} />
        <View className='hero-shade' />
        <View className='hero-content'>
          <View className='top-row'>
            <Text className='city-pill'>重庆</Text>
            <Text className='profile-link' onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}>我的</Text>
          </View>
          <View className='hero-main'>
            <Text className='eyebrow'>S1 山城调查局</Text>
            <Text className='brand'>城市探秘</Text>
            <Text className='tagline'>把真实街巷变成一场可通关、可炫耀、可收藏证书的城市冒险。</Text>
          </View>
          <View className='hero-meta'>
            <Text className='meta-chip'>GPS 打卡</Text>
            <Text className='meta-chip'>剧情解谜</Text>
            <Text className='meta-chip'>成就海报</Text>
          </View>
        </View>
      </View>

      {featuredQuest && (
        <View className='featured'>
          <View className='section-head'>
            <Text className='section-title'>今日任务</Text>
            <Text className='section-note'>重庆首发</Text>
          </View>

          <View className='feature-card' onClick={() => openDetail(featuredQuest.id)}>
            <View className='feature-cover-wrap'>
              <Image className='feature-cover' mode='aspectFill' src={featuredQuest.cover || questCover} />
              <Text className='cover-badge'>{hasStarted ? '继续调查' : 'S1 五章主线'}</Text>
            </View>
            <View className='feature-copy'>
              <Text className='quest-name'>{featuredQuest.title}</Text>
              <Text className='quest-desc'>{featuredQuest.description}</Text>
              <View className='quest-tags'>
                <Text className='quest-tag'>{featuredQuest.duration} 分钟</Text>
                <Text className='quest-tag'>{featuredQuest.distance} km</Text>
                <Text className='quest-tag'>{featuredQuest.difficulty}</Text>
              </View>
              <View className='quest-footer'>
                <View>
                  <Text className='price'>¥{Number(featuredQuest.price).toFixed(2)}</Text>
                  <Text className='price-caption'>开发模式可模拟支付</Text>
                </View>
                <Button type='primary' size='small' onClick={startFeatured}>
                  {hasStarted ? '继续挑战' : '开始探秘'}
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className='quick-grid'>
        <View className='quick-item'>
          <Text className='quick-value'>5</Text>
          <Text className='quick-label'>主线章节</Text>
        </View>
        <View className='quick-item'>
          <Text className='quick-value'>5.8km</Text>
          <Text className='quick-label'>步行距离</Text>
        </View>
        <View className='quick-item'>
          <Text className='quick-value'>1</Text>
          <Text className='quick-label'>调查员证书</Text>
        </View>
      </View>

      <View className='section-head'>
        <Text className='section-title'>热门路线</Text>
        <Text className='section-note'>{loading ? '加载中' : '可购买'}</Text>
      </View>
      {quests.map((quest) => (
        <View className='quest-row' key={quest.id} onClick={() => openDetail(quest.id)}>
          <Image className='row-cover' mode='aspectFill' src={quest.cover || questCover} />
          <View className='row-main'>
            <Text className='row-title'>{quest.title}</Text>
            <Text className='row-desc'>{quest.description}</Text>
            <Text className='row-meta'>{quest.duration} 分钟 · {quest.distance} km · {quest.difficulty}</Text>
          </View>
          <Text className='row-price'>¥{Number(quest.price).toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}
