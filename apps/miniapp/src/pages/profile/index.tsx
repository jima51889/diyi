import { Button } from '@nutui/nutui-react-taro';
import { Text, View } from '@tarojs/components';
import { useUserStore } from '../../store/user';
import './index.scss';

export default function ProfilePage() {
  const { userInfo, login } = useUserStore();
  return (
    <View className='page profile'>
      <View className='profile-hero'>
        <Text className='eyebrow'>个人中心</Text>
        <Text className='title'>{userInfo ? 'Local Player' : '未登录'}</Text>
        <Text className='subtitle'>订单、挑战记录、勋章和客服入口</Text>
        <Button type='primary' onClick={login}>模拟登录</Button>
      </View>
      <View className='menu'>
        <Text>我的订单</Text>
        <Text>挑战记录</Text>
        <Text>我的勋章</Text>
        <Text>联系客服</Text>
        <Text>设置</Text>
      </View>
    </View>
  );
}
