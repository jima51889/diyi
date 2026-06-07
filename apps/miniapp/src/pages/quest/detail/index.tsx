import { Button } from '@nutui/nutui-react-taro';
import { Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import questCover from '../../../assets/chongqing-letter-cover.jpg';
import { api } from '../../../services/api';
import { useUserStore } from '../../../store/user';
import './index.scss';

const s1Chapters = [
  { title: '第一章 消失的档案', displayDesc: '解放碑 · 老照片同角度拍摄' },
  { title: '第二章 白象居时空迷宫', displayDesc: '白象居 · 隐藏数字密码' },
  { title: '第三章 索道追击令', displayDesc: '长江索道 · 30 分钟追击打卡' },
  { title: '第四章 洪崖洞异闻录', displayDesc: '洪崖洞 · 三处观察点解谜' },
  { title: '第五章 十八梯最后的钥匙', displayDesc: '十八梯 · 扫描最终印章' }
];

const s1Quest = {
  title: '山城迷城计划：消失的山城核心',
  description:
    '一份失踪八十余年的档案重新出现。你将以山城调查局调查员身份，穿过解放碑、白象居、长江索道、洪崖洞与十八梯，通过拍照、答题、GPS 打卡和扫码验证推进剧情，最终解锁山城核心并获得调查员证书。',
  cover: questCover,
  difficulty: '进阶',
  duration: 180,
  distance: 5.8
};

function normalizeQuest(quest: any) {
  if (quest?.id !== 1) return quest;
  return {
    ...quest,
    title: s1Quest.title,
    description: s1Quest.description,
    cover: s1Quest.cover,
    difficulty: s1Quest.difficulty,
    duration: s1Quest.duration,
    distance: s1Quest.distance,
    nodes: quest.nodes?.map((node: any, index: number) => ({
      ...node,
      title: s1Chapters[index]?.title || node.title,
      displayDesc: s1Chapters[index]?.displayDesc || node.nodeType
    }))
  };
}

export default function QuestDetailPage() {
  const router = useRouter();
  const id = Number(router.params.id);
  const ensureLogin = useUserStore((state) => state.ensureLogin);
  const [quest, setQuest] = useState<any>();
  const [progress, setProgress] = useState<any>();
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const questRes = await api.quest(id);
      setQuest(normalizeQuest(questRes.data));
      await ensureLogin();
      const progressRes = await api.progress(id);
      setProgress(progressRes.data);
    };

    load();
  }, [ensureLogin, id]);

  const nodes = useMemo(() => quest?.nodes || [], [quest]);
  const isPaidOrStarted = progress?.status === 'in_progress' || progress?.status === 'finished';
  const actionText = progress?.status === 'finished' ? '再次挑战' : isPaidOrStarted ? '继续调查' : '开始调查';

  const buy = async () => {
    setBuying(true);
    try {
      await ensureLogin();
      const orderRes = await api.createOrder(id);
      const payRes = await api.mockPay(orderRes.data.orderId);
      setProgress({ status: 'in_progress', currentNode: payRes.data.currentNode });
      Taro.showToast({ title: '已模拟支付', icon: 'success' });
    } finally {
      setBuying(false);
    }
  };

  const start = async () => {
    await ensureLogin();
    if (!isPaidOrStarted) {
      await buy();
    }
    Taro.navigateTo({ url: `/pages/game/index?questId=${quest.id}` });
  };

  if (!quest) {
    return <View className='page detail loading'>加载中...</View>;
  }

  return (
    <View className='detail-page'>
      <View className='detail-hero'>
        <Image className='cover' mode='aspectFill' src={quest.cover || questCover} />
        <View className='hero-shade' />
        <View className='hero-copy'>
          <Text className='eyebrow'>S1 山城调查局档案</Text>
          <Text className='title'>{quest.title}</Text>
          <Text className='subtitle'>剧情体验 · 城市探索 · 解谜挑战 · 社交炫耀</Text>
        </View>
      </View>

      <View className='detail-body'>
        <View className='stats'>
          <View className='stat'>
            <Text className='stat-value'>{quest.duration}</Text>
            <Text className='stat-label'>分钟</Text>
          </View>
          <View className='stat'>
            <Text className='stat-value'>{quest.distance}</Text>
            <Text className='stat-label'>公里</Text>
          </View>
          <View className='stat'>
            <Text className='stat-value'>{quest.difficulty}</Text>
            <Text className='stat-label'>难度</Text>
          </View>
        </View>

        <View className='status-card'>
          <View>
            <Text className='status-title'>{isPaidOrStarted ? '调查权限已解锁' : '购买后解锁完整调查档案'}</Text>
            <Text className='status-copy'>{isPaidOrStarted ? '可从当前章节继续推进山城核心线索。' : '开发模式下点击开始调查会自动模拟支付。'}</Text>
          </View>
          <Text className='status-pill'>{progress?.status || 'not_started'}</Text>
        </View>

        <View className='section'>
          <Text className='section-title'>剧情简介</Text>
          <Text className='desc'>{quest.description}</Text>
        </View>

        <View className='section'>
          <View className='section-head compact'>
            <Text className='section-title'>五章主线</Text>
            <Text className='section-note'>{nodes.length} 章</Text>
          </View>
          <View className='timeline'>
            {nodes.map((node: any) => (
              <View className='timeline-item' key={node.id}>
                <Text className='dot'>{node.nodeIndex}</Text>
                <View className='timeline-copy'>
                  <Text className='node-title'>{node.title}</Text>
                  <Text className='node-type'>{node.displayDesc || node.nodeType.toUpperCase()}</Text>
                </View>
                <Text className='node-badge'>{node.nodeType.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='section guide'>
          <Text className='section-title'>出发提示</Text>
          <Text className='guide-copy'>建议预留约 3 小时，穿适合步行的鞋，并开启定位权限。部分章节会生成成就卡，适合拍照与分享。</Text>
        </View>
      </View>

      <View className='action-bar'>
        <View>
          <Text className='price'>¥{Number(quest.price).toFixed(2)}</Text>
          <Text className='price-note'>{isPaidOrStarted ? '已解锁' : '开发模式可模拟支付'}</Text>
        </View>
        <View className='actions'>
          {!isPaidOrStarted && <Button plain type='primary' loading={buying} onClick={buy}>购买</Button>}
          <Button type='primary' loading={buying} onClick={start}>{actionText}</Button>
        </View>
      </View>
    </View>
  );
}
