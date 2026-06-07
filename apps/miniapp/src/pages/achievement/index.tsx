import { Button } from '@nutui/nutui-react-taro';
import { Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { api } from '../../services/api';
import { useUserStore } from '../../store/user';
import './index.scss';

const s1Title = '山城迷城计划：消失的山城核心';

export default function AchievementPage() {
  const ensureLogin = useUserStore((state) => state.ensureLogin);
  const [records, setRecords] = useState<any[]>([]);

  useDidShow(() => {
    const load = async () => {
      await ensureLogin();
      const { data } = await api.finishRecords();
      setRecords(data);
    };

    load();
  });

  const latest = records[0];

  const copyCertificate = async () => {
    if (!latest?.certificateUrl) return;
    await Taro.setClipboardData({ data: latest.certificateUrl });
    Taro.showToast({ title: '证书链接已复制', icon: 'success' });
  };

  return (
    <View className='page achievement'>
      <View className='achievement-hero'>
        <Text className='eyebrow'>山城调查局档案</Text>
        <Text className='title'>调查员证书</Text>
        <Text className='subtitle'>完成真实城市任务后，系统会生成专属编号、通关记录与可分享证书。</Text>
      </View>

      {latest ? (
        <View className='certificate'>
          <Text className='cert-brand'>城市探秘</Text>
          <Text className='cert-title'>重庆00017号调查员</Text>
          <Text className='cert-route'>{latest.questTitle || s1Title}</Text>
          <View className='cert-line' />
          <View className='cert-row'>
            <Text>玩家</Text>
            <Text>Local Player</Text>
          </View>
          <View className='cert-row'>
            <Text>完成时间</Text>
            <Text>{new Date(latest.finishTime).toLocaleString()}</Text>
          </View>
          <View className='cert-row'>
            <Text>证书编号</Text>
            <Text>CQ-SIB-{String(latest.id).padStart(4, '0')}</Text>
          </View>
          <View className='seal'>PASS</View>
          <Text className='cert-url'>{latest.certificateUrl}</Text>
          <Button plain type='primary' block onClick={copyCertificate}>复制证书链接</Button>
        </View>
      ) : (
        <View className='empty-panel'>
          <Text className='empty-title'>还没有通关记录</Text>
          <Text className='empty-copy'>完成《山城迷城计划：消失的山城核心》后，这里会展示你的专属调查员证书。</Text>
          <Button type='primary' block onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>去首页选择路线</Button>
        </View>
      )}

      <View className='badge-row'>
        <View className='badge-card'>
          <Text className='badge-value'>{records.length}</Text>
          <Text className='badge-label'>通关次数</Text>
        </View>
        <View className='badge-card'>
          <Text className='badge-value'>{latest ? '已获得' : '待解锁'}</Text>
          <Text className='badge-label'>重庆调查员勋章</Text>
        </View>
      </View>

      <View className='records'>
        <View className='section-head'>
          <Text className='section-title'>通关记录</Text>
          <Text className='section-note'>{records.length} 条</Text>
        </View>
        {records.map((record) => (
          <View className='record' key={record.id}>
            <View>
              <Text className='record-title'>{record.questTitle || s1Title}</Text>
              <Text className='record-time'>{new Date(record.finishTime).toLocaleString()}</Text>
            </View>
            <Text className='record-duration'>{record.duration}s</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
