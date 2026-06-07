export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/quest/detail/index',
    'pages/game/index',
    'pages/achievement/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0d2725',
    navigationBarTitleText: '城市探秘',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#667085',
    selectedColor: '#0f766e',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/achievement/index', text: '成就' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  }
});
