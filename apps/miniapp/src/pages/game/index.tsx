import { Button, Input } from '@nutui/nutui-react-taro';
import { Map, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useUserStore } from '../../store/user';
import './index.scss';

const nodeCopy = [
  {
    title: '第一章 消失的档案',
    location: '解放碑',
    content:
      'AI 来电接入：调查员，一份失踪八十余年的档案重新出现。请前往解放碑，找到 1938 年老照片的同角度位置。',
    objective: '拍摄同角度照片，完成 1938 ↔ 2026 时间裂缝比对',
    hint: '本地开发模式下可直接模拟照片通过。',
    shareTitle: '我找到了1938年的重庆',
    badge: '时间裂缝发现者'
  },
  {
    title: '第二章 白象居时空迷宫',
    location: '白象居',
    content:
      '档案显示：白象居存在一个不存在的楼层。寻找隐藏数字、特殊楼层与神秘标记，组合出下一段密码。',
    objective: '输入三枚隐藏数字组成的密码',
    hint: '本地演示答案：817',
    shareTitle: '重庆最离谱的楼终于被我破解了',
    badge: '时空迷宫破解者'
  },
  {
    title: '第三章 索道追击令',
    location: '长江索道',
    content:
      '嫌疑人正乘索道逃离，系统开启 30 分钟追击倒计时。你必须过江，抵达索道终点并完成定位验证。',
    objective: '抵达指定范围完成 GPS 打卡',
    hint: '无法定位时，开发模式会使用节点坐标模拟到达。',
    shareTitle: '重庆索道追捕行动成功',
    badge: '索道追击员'
  },
  {
    title: '第四章 洪崖洞异闻录',
    location: '洪崖洞',
    content:
      '真正的密码库隐藏于洪崖洞。三个观察点会给出不同数字，组合后即可打开机密录像。',
    objective: '输入三处观察点合成的最终密码',
    hint: '本地演示答案：1938',
    shareTitle: '洪崖洞密码已破解',
    badge: '洪崖洞征服者'
  },
  {
    title: '第五章 十八梯最后的钥匙',
    location: '十八梯',
    content:
      '所有碎片已经集齐。拼接地图、密码与档案，扫描最后的调查局印章，解锁山城核心。',
    objective: '扫描最终印章，生成调查员证书',
    hint: '本地开发模式下可直接模拟扫码通过。',
    shareTitle: '我成为了重庆山城调查局调查员',
    badge: '重庆调查员'
  }
];

function normalizeNode(node: any) {
  const copy = nodeCopy[(node?.nodeIndex || 1) - 1];
  if (!copy) return node;
  return {
    ...node,
    ...copy,
    reward: {
      ...(node.reward || {}),
      shareTitle: copy.shareTitle,
      badge: copy.badge,
      location: copy.location,
      objective: copy.objective,
      hint: copy.hint
    }
  };
}

export default function GamePage() {
  const router = useRouter();
  const questId = Number(router.params.questId);
  const ensureLogin = useUserStore((state) => state.ensureLogin);
  const [quest, setQuest] = useState<any>();
  const [currentNodeId, setCurrentNodeId] = useState<number | null>();
  const [answer, setAnswer] = useState('');
  const [startedAt] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!questId) return;

    const load = async () => {
      await ensureLogin();
      const [questRes, progressRes] = await Promise.all([api.quest(questId), api.progress(questId)]);
      const normalizedNodes = questRes.data.nodes.map(normalizeNode);
      const firstNodeId = normalizedNodes[0]?.id ?? null;
      const progressNode = normalizedNodes.some((item: any) => item.id === progressRes.data.currentNode)
        ? progressRes.data.currentNode
        : firstNodeId;
      setQuest({ ...questRes.data, title: '山城迷城计划：消失的山城核心', nodes: normalizedNodes });
      setCurrentNodeId(progressNode);
    };

    load();
  }, [ensureLogin, questId]);

  const node = useMemo(
    () => quest?.nodes?.find((item: any) => item.id === currentNodeId),
    [quest, currentNodeId]
  );

  const nextNode = useMemo(() => {
    if (!quest?.nodes || !node?.nextNode) return null;
    return quest.nodes.find((item: any) => item.id === Number(node.nextNode));
  }, [node, quest]);

  const progressText = useMemo(() => {
    if (!quest?.nodes?.length || !node) return '已完成';
    return `${node.nodeIndex}/${quest.nodes.length}`;
  }, [node, quest]);

  const progressPercent = useMemo(() => {
    if (!quest?.nodes?.length || !node) return 100;
    return Math.round((node.nodeIndex / quest.nodes.length) * 100);
  }, [node, quest]);

  const agentNo = useMemo(() => `SIB-${String(questId || 1).padStart(4, '0')}-0017`, [questId]);

  const finishQuest = async () => {
    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    await api.finish({ questId, duration });
    Taro.showToast({ title: '通关成功', icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/achievement/index' });
    }, 500);
  };

  const advance = async (next: number | null) => {
    if (next) {
      setCurrentNodeId(next);
      return;
    }
    setCurrentNodeId(null);
    await finishQuest();
  };

  const checkin = async () => {
    if (!node) return;
    setBusy(true);
    try {
      let lat = Number(node.lat);
      let lng = Number(node.lng);
      try {
        const location = await Taro.getLocation({ type: 'gcj02' });
        lat = location.latitude;
        lng = location.longitude;
      } catch {
        lat = Number(node.lat);
        lng = Number(node.lng);
      }

      const { data } = await api.checkin({ questId, nodeId: node.id, lat, lng });
      if (data.success) {
        Taro.showToast({ title: '打卡成功', icon: 'success' });
        await advance(data.nextNode);
      } else {
        Taro.showToast({ title: `还差 ${data.distance}m`, icon: 'none' });
      }
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (!node) return;
    setBusy(true);
    try {
      const { data } = await api.answer({ nodeId: node.id, answer });
      if (data.pass) {
        setAnswer('');
        Taro.showToast({ title: '回答正确', icon: 'success' });
        await advance(data.nextNode);
      } else {
        Taro.showToast({ title: '答案不对，再想想', icon: 'none' });
      }
    } finally {
      setBusy(false);
    }
  };

  const passPhoto = async () => {
    if (!node) return;
    setBusy(true);
    try {
      const { data } = await api.photo({ nodeId: node.id, payload: 'local-photo-mock' });
      Taro.showToast({ title: '照片已通过', icon: 'success' });
      await advance(data.nextNode);
    } finally {
      setBusy(false);
    }
  };

  const passQr = async () => {
    if (!node) return;
    setBusy(true);
    try {
      const { data } = await api.qr({ nodeId: node.id, payload: 'local-qr-mock' });
      Taro.showToast({ title: '扫码已通过', icon: 'success' });
      await advance(data.nextNode);
    } finally {
      setBusy(false);
    }
  };

  const showShareCard = () => {
    if (!node) return;
    Taro.showToast({ title: '成就卡已生成', icon: 'success' });
  };

  if (!quest || currentNodeId === undefined) {
    return <View className='page game loading'>加载中...</View>;
  }

  if (!node) {
    return (
      <View className='page game complete-state'>
        <Text className='complete-title'>山城核心已解锁</Text>
        <Text className='complete-copy'>恭喜你成为重庆第 00017 位完成山城迷城计划的调查员。</Text>
        <Button type='primary' block onClick={() => Taro.switchTab({ url: '/pages/achievement/index' })}>查看调查员证书</Button>
      </View>
    );
  }

  return (
    <View className='page game'>
      <View className='mission-header'>
        <View>
          <Text className='route-name'>{quest.title}</Text>
          <Text className='chapter'>{node.title}</Text>
        </View>
        <Text className='progress'>{progressText}</Text>
      </View>

      <View className='progress-rail'>
        <View className='progress-fill' style={{ width: `${progressPercent}%` }} />
      </View>

      <View className='story-panel'>
        <Text className='panel-label'>AI 来电 · {agentNo}</Text>
        <Text className='story'>{node.content}</Text>
      </View>

      <View className='task-panel'>
        <Text className='panel-label'>当前地点 · {node.location}</Text>
        <Text className='task-title'>{node.objective}</Text>
        <Text className='task-note'>{node.hint}</Text>
      </View>

      {node.nodeType === 'gps' && (
        <View className='map-wrap'>
          <Map
            className='map'
            latitude={Number(node.lat)}
            longitude={Number(node.lng)}
            markers={[{ id: node.id, latitude: Number(node.lat), longitude: Number(node.lng), title: node.location }]}
          />
          <View className='map-chip'>
            <Text>验证半径 {node.radius || 80}m</Text>
          </View>
        </View>
      )}

      {node.nodeType === 'qa' && (
        <View className='answer-panel'>
          <Input value={answer} placeholder='输入调查密码' onChange={(value) => setAnswer(String(value))} />
        </View>
      )}

      <View className='next-card' onClick={showShareCard}>
        <Text className='panel-label'>可生成分享素材</Text>
        <Text className='next-title'>{node.shareTitle}</Text>
      </View>

      {nextNode && (
        <View className='next-card'>
          <Text className='panel-label'>下一章预告</Text>
          <Text className='next-title'>{nextNode.title}</Text>
        </View>
      )}

      <View className='action-panel'>
        {node.nodeType === 'gps' && <Button type='primary' block loading={busy} onClick={checkin}>GPS 打卡</Button>}
        {node.nodeType === 'qa' && <Button type='primary' block loading={busy} onClick={submitAnswer}>提交答案</Button>}
        {node.nodeType === 'photo' && <Button type='primary' block loading={busy} onClick={passPhoto}>模拟照片通过</Button>}
        {node.nodeType === 'qr' && <Button type='primary' block loading={busy} onClick={passQr}>模拟扫码通过</Button>}
      </View>
    </View>
  );
}
