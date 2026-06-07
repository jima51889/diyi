import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, CityEvent, EventAssignment, getSavedUser, login, logout, Quest, QuestNode } from './api';
import './styles.css';

type Tab = 'login' | 'home' | 'city' | 'creator' | 'detail' | 'purchase' | 'booking' | 'event' | 'game' | 'achievement';

const questId = 1;
const cities = [
  { name: '重庆', status: '已开放', note: 'S1《雾都失落档案》验证城市' },
  { name: '成都', status: '筹备中', note: '茶馆、老街、夜游路线规划中' },
  { name: '西安', status: '筹备中', note: '城墙、碑林、唐风谜题方向' },
  { name: '长沙', status: '筹备中', note: '江边夜游与老街探秘方向' },
  { name: '广州', status: '筹备中', note: '骑楼、码头、商埠档案方向' }
];

const travelSlots = ['今天 14:00', '今天 19:30', '明天 10:00', '周末 15:00'];

function nodeActionLabel(node?: QuestNode) {
  if (!node) return '继续';
  if (node.nodeType === 'photo') return '模拟照片通过';
  if (node.nodeType === 'qa') return '提交答案';
  if (node.nodeType === 'gps') return 'GPS 模拟打卡';
  if (node.nodeType === 'qr') return '模拟扫码通过';
  if (node.nodeType === 'challenge') return '模拟 NPC 闯关通过';
  return '完成任务';
}

function defaultAnswer(node?: QuestNode) {
  if (!node) return '';
  if (node.nodeIndex === 2) return '8D';
  if (node.nodeIndex === 4) return '713';
  if (node.nodeIndex === 5) return 'SC1938';
  return '';
}

function formatCountdown(seconds?: number) {
  const safe = Math.max(0, seconds || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function App() {
  const [tab, setTab] = useState<Tab>(() => (getSavedUser() ? 'home' : 'login'));
  const [user, setUser] = useState<any>(() => getSavedUser());
  const [selectedCity, setSelectedCity] = useState('重庆');
  const [quest, setQuest] = useState<Quest | null>(null);
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [assignment, setAssignment] = useState<EventAssignment | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<number | null | undefined>(undefined);
  const [progressStatus, setProgressStatus] = useState('not_started');
  const [selectedSlot, setSelectedSlot] = useState(travelSlots[1]);
  const [answer, setAnswer] = useState('');
  const [eventAnswer, setEventAnswer] = useState('SC1938');
  const [records, setRecords] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [startedAt] = useState(Date.now());

  const node = useMemo(() => quest?.nodes.find((item) => item.id === currentNodeId), [quest, currentNodeId]);
  const nextNode = useMemo(() => quest?.nodes.find((item) => item.id === node?.nextNode), [quest, node]);
  const todayEvent = events[0];

  const progressPercent = useMemo(() => {
    if (!quest?.nodes.length || !node) return currentNodeId === null ? 100 : 0;
    return Math.round((node.nodeIndex / quest.nodes.length) * 100);
  }, [currentNodeId, node, quest]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const loadPublic = async () => {
    const [questRes, eventRes] = await Promise.all([api.quest(questId), api.todayEvents(selectedCity)]);
    setQuest(questRes.data);
    setEvents(eventRes.data);
  };

  const loadAuthed = async () => {
    const [questRes, progressRes, recordRes, eventRes, assignmentRes] = await Promise.all([
      api.quest(questId),
      api.progress(questId),
      api.finishRecords(),
      api.todayEvents(selectedCity),
      api.eventAssignment(selectedCity)
    ]);
    setQuest(questRes.data);
    setEvents(eventRes.data);
    setAssignment(assignmentRes.data);
    setCurrentNodeId(progressRes.data.currentNode ?? questRes.data.nodes[0]?.id ?? null);
    setProgressStatus(progressRes.data.status || 'not_started');
    setRecords(recordRes.data);
  };

  useEffect(() => {
    const load = user ? loadAuthed : loadPublic;
    load().catch(() => showToast('加载失败，请确认 API 已启动'));
  }, [user?.id, selectedCity]);

  useEffect(() => {
    setAnswer(defaultAnswer(node));
  }, [node?.id]);

  const submitLogin = async (nickname: string) => {
    setBusy(true);
    try {
      const data = await login(nickname || 'H5 Player');
      setUser(data.userInfo);
      await loadAuthed();
      setTab('home');
      showToast('登录成功');
    } finally {
      setBusy(false);
    }
  };

  const requireLogin = (next: Tab) => {
    if (!user) {
      setTab('login');
      showToast('请先登录或注册');
      return false;
    }
    setTab(next);
    return true;
  };

  const selectCity = (city: string) => {
    setSelectedCity(city);
    if (city !== '重庆') {
      showToast(`${city}正在筹备中，当前开放重庆验证版`);
      return;
    }
    setTab('home');
  };

  const claimEvent = async () => {
    if (!todayEvent) return;
    if (!user && !requireLogin('event')) return;
    setBusy(true);
    try {
      const { data } = await api.claimEvent(todayEvent.id);
      setAssignment(data);
      setEventAnswer(data.task.taskType === 'qa' ? 'SC1938' : '');
      setTab('event');
      showToast('今日事件已领取');
    } finally {
      setBusy(false);
    }
  };

  const completeEvent = async () => {
    if (!assignment) return;
    setBusy(true);
    try {
      const response =
        assignment.task.taskType === 'qa'
          ? await api.answerEventTask(assignment.task.id, eventAnswer)
          : await api.passEventTask(assignment.task.id);
      if (response.data.pass === false) {
        showToast('答案不对');
        return;
      }
      setAssignment(response.data.assignment || response.data);
      showToast('今日事件已完成');
    } finally {
      setBusy(false);
    }
  };

  const payOnly = async () => {
    if (!user) {
      requireLogin('purchase');
      return;
    }
    setBusy(true);
    try {
      const orderRes = await api.createOrder(questId);
      const payRes = await api.mockPay(orderRes.data.orderId);
      setCurrentNodeId(payRes.data.currentNode);
      setProgressStatus('purchased');
      setTab('booking');
      showToast('购买成功，可预约出发时间');
    } finally {
      setBusy(false);
    }
  };

  const startQuest = async () => {
    if (!user) {
      requireLogin('booking');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.startGame(questId);
      setCurrentNodeId(data.currentNode);
      setProgressStatus(data.status);
      setTab('game');
      showToast('挑战已开始');
    } finally {
      setBusy(false);
    }
  };

  const finishQuest = async () => {
    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    await api.finish(questId, duration);
    const { data } = await api.finishRecords();
    setRecords(data);
    setCurrentNodeId(null);
    setProgressStatus('finished');
    setTab('achievement');
    showToast('山城核心已解锁');
  };

  const advance = async (next?: number | null) => {
    if (next) {
      setCurrentNodeId(next);
      return;
    }
    await finishQuest();
  };

  const passCurrentNode = async () => {
    if (!node) return;
    setBusy(true);
    try {
      if (node.nodeType === 'photo') {
        const { data } = await api.photo(node.id);
        showToast('照片验证通过');
        await advance(data.nextNode);
      } else if (node.nodeType === 'qa') {
        const { data } = await api.answer(node.id, answer);
        if (!data.pass) {
          showToast('答案不对');
          return;
        }
        showToast('密码正确');
        await advance(data.nextNode);
      } else if (node.nodeType === 'gps') {
        const { data } = await api.checkin(questId, node);
        if (!data.success) {
          showToast(`距离还差 ${data.distance}m`);
          return;
        }
        showToast('GPS 打卡成功');
        await advance(data.nextNode);
      } else if (node.nodeType === 'qr') {
        const { data } = await api.qr(node.id);
        showToast('扫码验证通过');
        await advance(data.nextNode);
      } else if (node.nodeType === 'challenge') {
        const { data } = await api.challenge(node.id);
        showToast('线人试炼通过');
        await advance(data.nextNode);
      }
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    logout();
    setUser(null);
    setAssignment(null);
    setCurrentNodeId(undefined);
    setProgressStatus('not_started');
    setRecords([]);
    setTab('login');
  };

  return (
    <main className="app-shell">
      <section className="phone-app">
        {tab === 'login' && (
          <LoginView busy={busy} onLogin={submitLogin} onBrowse={() => setTab('home')} onCity={() => setTab('city')} onCreator={() => setTab('creator')} />
        )}
        {tab === 'home' && (
          <HomeView
            quest={quest}
            user={user}
            selectedCity={selectedCity}
            event={todayEvent}
            assignment={assignment}
            progressStatus={progressStatus}
            busy={busy}
            onOpenDetail={() => setTab('detail')}
            onLogin={() => setTab('login')}
            onLogout={signOut}
            onCity={() => setTab('city')}
            onCreator={() => setTab('creator')}
            onClaimEvent={claimEvent}
            onOpenEvent={() => requireLogin('event')}
            onBooking={() => requireLogin('booking')}
          />
        )}
        {tab === 'city' && <CityView selectedCity={selectedCity} onSelect={selectCity} onBack={() => setTab('home')} />}
        {tab === 'creator' && <CreatorView user={user} onLogin={() => setTab('login')} onBack={() => setTab('home')} />}
        {tab === 'detail' && (
          <DetailView
            quest={quest}
            progressStatus={progressStatus}
            onPurchase={() => requireLogin(progressStatus === 'purchased' || progressStatus === 'in_progress' ? 'booking' : 'purchase')}
            onCity={() => setTab('city')}
          />
        )}
        {tab === 'purchase' && <PurchaseView quest={quest} busy={busy} user={user} onPay={payOnly} onBack={() => setTab('detail')} />}
        {tab === 'booking' && (
          <BookingView
            quest={quest}
            busy={busy}
            selectedSlot={selectedSlot}
            progressStatus={progressStatus}
            onSlot={setSelectedSlot}
            onStart={startQuest}
            onBack={() => setTab('detail')}
          />
        )}
        {tab === 'event' && (
          <EventView event={todayEvent} assignment={assignment} answer={eventAnswer} busy={busy} onAnswer={setEventAnswer} onClaim={claimEvent} onComplete={completeEvent} onBack={() => setTab('home')} />
        )}
        {tab === 'game' && (
          <GameView quest={quest} node={node} nextNode={nextNode} answer={answer} busy={busy} progressPercent={progressPercent} onAnswer={setAnswer} onPass={passCurrentNode} onFinishTab={() => setTab('achievement')} />
        )}
        {tab === 'achievement' && <AchievementView records={records} questTitle={quest?.title} onReload={loadAuthed} />}

        {!['login', 'purchase', 'city', 'creator', 'booking'].includes(tab) && (
          <nav className="tabbar">
            <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>首页</button>
            <button className={tab === 'event' ? 'active' : ''} onClick={() => requireLogin('event')}>事件</button>
            <button className={tab === 'game' ? 'active' : ''} onClick={() => requireLogin(progressStatus === 'purchased' ? 'booking' : 'game')}>任务</button>
            <button className={tab === 'achievement' ? 'active' : ''} onClick={() => requireLogin('achievement')}>证书</button>
          </nav>
        )}
        {toast && <div className="toast">{toast}</div>}
      </section>
    </main>
  );
}

function LoginView(props: { busy: boolean; onLogin: (nickname: string) => void; onBrowse: () => void; onCity: () => void; onCreator: () => void }) {
  const { busy, onLogin, onBrowse, onCity, onCreator } = props;
  const [nickname, setNickname] = useState('H5 Player');
  return (
    <div className="screen login-screen">
      <div className="auth-hero">
        <span>全国城市探秘平台</span>
        <h1>登录后开始调查</h1>
        <p>购买剧本后先解锁路线，再预约出发时间；到现场后点击开始挑战，进度才正式启动。</p>
      </div>
      <div className="platform-entry-row">
        <button className="mini-entry" onClick={onCity}><strong>城市选择</strong><span>重庆已开放</span></button>
        <button className="mini-entry" onClick={onCreator}><strong>创作者入口</strong><span>剧本入驻预留</span></button>
      </div>
      <div className="auth-card">
        <label>
          <span>昵称</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="输入你的调查员昵称" />
        </label>
        <button className="primary-action" disabled={busy} onClick={() => onLogin(nickname)}>{busy ? '登录中...' : '登录 / 注册'}</button>
        <button className="secondary-action" onClick={onBrowse}>先浏览路线</button>
      </div>
    </div>
  );
}

function HomeView(props: {
  quest: Quest | null;
  user: any;
  selectedCity: string;
  event?: CityEvent;
  assignment: EventAssignment | null;
  progressStatus: string;
  busy: boolean;
  onOpenDetail: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onCity: () => void;
  onCreator: () => void;
  onClaimEvent: () => void;
  onOpenEvent: () => void;
  onBooking: () => void;
}) {
  const { quest, user, selectedCity, event, assignment, progressStatus, busy, onOpenDetail, onLogin, onLogout, onCity, onCreator, onClaimEvent, onOpenEvent, onBooking } = props;
  return (
    <div className="screen home-screen">
      <div className="hero">
        <div className="topline">
          <button className="city-button" onClick={onCity}>{selectedCity} · 切换城市</button>
          <button className="text-link" onClick={user ? onLogout : onLogin}>{user ? '退出' : '登录'}</button>
        </div>
        <div>
          <span className="badge">全国城市探秘平台 · 重庆验证版</span>
          <h1>城市探秘</h1>
          <p>打开以后，不只是选一条路线，而是看见今天这座城市又发生了什么。</p>
        </div>
        <div className="chips"><span>动态事件</span><span>主线剧本</span><span>预约出发</span></div>
      </div>

      <div className="platform-entry-row">
        <button className="mini-entry" onClick={onCity}><strong>全国城市</strong><span>重庆 / 成都 / 西安...</span></button>
        <button className="mini-entry" onClick={onCreator}><strong>创作者入驻</strong><span>设计你的城市线路</span></button>
      </div>

      {progressStatus === 'purchased' && (
        <button className="booking-banner" onClick={onBooking}>
          <span>已购买待出发</span>
          <strong>预约时间 / 开始挑战</strong>
        </button>
      )}

      <div className="section-title">
        <span>今日重庆发生了什么？</span>
        <small>{event ? `剩余 ${formatCountdown(event.remainingSeconds)}` : '暂无事件'}</small>
      </div>
      {event && (
        <button className="event-card" onClick={assignment ? onOpenEvent : onClaimEvent}>
          <span className="badge">{event.rarity === 'limited' ? '限时事件' : '今日事件'}</span>
          <h2>{event.title}</h2>
          <p>{event.summary}</p>
          <div className="event-meta"><span>{event.taskCount} 个随机任务</span><span>{event.reward?.treasure || '城市线索'}</span></div>
          <strong>{assignment ? `已领取：${assignment.role?.name || '调查员'}` : busy ? '领取中...' : '领取今日事件'}</strong>
        </button>
      )}

      <div className="section-title">
        <span>{selectedCity}首发主线</span>
        <small>{user ? `已登录：${user.nickname || '调查员'}` : '游客浏览'}</small>
      </div>
      <button className="quest-card" onClick={onOpenDetail}>
        <span className="badge">S1 五章主线</span>
        <h2>{quest?.title || '雾都失落档案'}</h2>
        <p>{quest?.description || '正在加载路线档案...'}</p>
        <div className="meta-row"><span>{quest?.duration || 135} 分钟</span><span>{quest?.distance || 5.8} km</span><span>{quest?.difficulty || '进阶'}</span></div>
      </button>
      <button className="primary-action" onClick={onOpenDetail}>查看路线详情</button>
    </div>
  );
}

function CityView({ selectedCity, onSelect, onBack }: { selectedCity: string; onSelect: (city: string) => void; onBack: () => void }) {
  return (
    <div className="screen">
      <div className="page-head"><button className="text-link" onClick={onBack}>返回</button><span>城市选择</span></div>
      <div className="compact-hero city-hero"><span>全国城市探秘网络</span><h1>选择你的城市</h1><p>当前先用重庆验证付费与完赛率，后续复制到更多城市。</p></div>
      <div className="city-list">
        {cities.map((city) => (
          <button className={city.name === selectedCity ? 'city-card active' : 'city-card'} key={city.name} onClick={() => onSelect(city.name)}>
            <div><strong>{city.name}</strong><span>{city.note}</span></div><em>{city.status}</em>
          </button>
        ))}
      </div>
    </div>
  );
}

function CreatorView({ user, onLogin, onBack }: { user: any; onLogin: () => void; onBack: () => void }) {
  return (
    <div className="screen creator-screen">
      <div className="page-head"><button className="text-link" onClick={onBack}>返回</button><span>创作者入口</span></div>
      <div className="compact-hero creator-hero"><span>城市实景剧本创作者平台</span><h1>把你的城市故事做成可售卖路线</h1><p>未来创作者可设计实景线路、配置任务节点、提交平台审核，上线后按订单获得分佣。</p></div>
      <div className="creator-flow">
        {['提交入驻资料', '创建城市剧本', '配置任务节点', '平台审核上线', '订单分佣结算'].map((item, index) => <div className="flow-item" key={item}><i>{index + 1}</i><span>{item}</span></div>)}
      </div>
      <button className="primary-action" onClick={user ? () => undefined : onLogin}>{user ? '申请入驻（即将开放）' : '登录后申请入驻'}</button>
    </div>
  );
}

function DetailView({ quest, progressStatus, onPurchase, onCity }: { quest: Quest | null; progressStatus: string; onPurchase: () => void; onCity: () => void }) {
  const cta = progressStatus === 'purchased' ? '预约 / 开始挑战' : progressStatus === 'in_progress' ? '继续挑战' : '购买剧本';
  return (
    <div className="screen">
      <div className="compact-hero"><span>S1 雾都会档案 · <button className="inline-link" onClick={onCity}>重庆</button></span><h1>{quest?.title || '雾都失落档案'}</h1><p>剧情体验 · 城市探索 · 解谜挑战 · 社交炫耀</p></div>
      <div className="stats"><div><strong>{quest?.duration || 135}</strong><span>分钟</span></div><div><strong>{quest?.distance || 5.8}</strong><span>公里</span></div><div><strong>{quest?.difficulty || '进阶'}</strong><span>难度</span></div></div>
      <article className="action-ratio">
        <span>MMOCG 城市行动配比</span>
        <h2>你不是在看剧情，而是在参加一次真实城市行动</h2>
        <div className="ratio-grid">
          <div><strong>20%</strong><small>城市探索</small></div>
          <div><strong>30%</strong><small>挑战机制</small></div>
          <div><strong>30%</strong><small>真人互动</small></div>
          <div><strong>20%</strong><small>剧情沉浸</small></div>
        </div>
      </article>
      <article className="panel"><h2>购买后不立即开始</h2><p>剧本票购买后会先解锁路线。你可以预约出发时间，到了线下起点再点击“开始挑战”，系统才开始记录进度和通关耗时。</p></article>
      <article className="panel"><h2>真人互动闯关</h2><p>主线中已加入“线人试炼”节点：玩家需要与真人 NPC 或合作商家线人完成暗号接头、限时观察和信封领取。MVP 阶段先用模拟通过验证流程。</p></article>
      <article className="panel"><h2>剧情简介</h2><p>{quest?.description}</p></article>
      <div className="timeline">
        {(quest?.nodes || []).map((node) => <div className="timeline-item" key={node.id}><i>{node.nodeIndex}</i><div><strong>{node.title}</strong><span>{node.reward?.location || '重庆'} · {node.reward?.objective || node.nodeType.toUpperCase()}</span></div><em>{node.nodeType.toUpperCase()}</em></div>)}
      </div>
      <button className="primary-action sticky" onClick={onPurchase}>{cta}</button>
    </div>
  );
}

function PurchaseView({ quest, user, busy, onPay, onBack }: { quest: Quest | null; user: any; busy: boolean; onPay: () => void; onBack: () => void }) {
  return (
    <div className="screen purchase-screen">
      <div className="purchase-head"><button className="text-link" onClick={onBack}>返回</button><span>订单确认</span></div>
      <article className="purchase-card"><span className="badge">重庆 · S1</span><h1>{quest?.title || '雾都失落档案'}</h1><p>购买后解锁路线，不会自动开始任务。你可先预约时间，之后再从出发页开始挑战。</p><div className="price-line"><span>剧本票</span><strong>¥{Number(quest?.price || 39.9).toFixed(2)}</strong></div></article>
      <div className="order-panel"><div><span>购买账号</span><strong>{user?.nickname || 'H5 Player'}</strong></div><div><span>开始方式</span><strong>购买后手动开始</strong></div><div><span>支付方式</span><strong>开发模式模拟支付</strong></div></div>
      <button className="primary-action sticky" disabled={busy} onClick={onPay}>{busy ? '支付处理中...' : `确认支付 ¥${Number(quest?.price || 39.9).toFixed(2)}`}</button>
    </div>
  );
}

function BookingView({ quest, busy, selectedSlot, progressStatus, onSlot, onStart, onBack }: { quest: Quest | null; busy: boolean; selectedSlot: string; progressStatus: string; onSlot: (slot: string) => void; onStart: () => void; onBack: () => void }) {
  return (
    <div className="screen booking-screen">
      <div className="page-head"><button className="text-link" onClick={onBack}>返回</button><span>预约出发</span></div>
      <div className="compact-hero booking-hero"><span>已购买 · 待出发</span><h1>{quest?.title || '雾都失落档案'}</h1><p>选择一个预计出发时间。MVP 阶段不锁库存，主要用于验证用户是否愿意规划线下游玩。</p></div>
      <div className="booking-status"><span>当前状态</span><strong>{progressStatus === 'in_progress' ? '挑战中' : '已购买，未开始'}</strong></div>
      <div className="section-title"><span>选择出发时间</span><small>可修改</small></div>
      <div className="slot-grid">{travelSlots.map((slot) => <button className={slot === selectedSlot ? 'slot active' : 'slot'} key={slot} onClick={() => onSlot(slot)}>{slot}</button>)}</div>
      <article className="panel"><h2>到现场后再开始</h2><p>点击开始挑战后，系统会进入第一章剧情，并开始记录任务进度。正式版可在这里接入预约名额、退款规则、组队人数和客服提示。</p></article>
      <button className="primary-action sticky" disabled={busy} onClick={onStart}>{busy ? '启动中...' : '开始挑战'}</button>
    </div>
  );
}

function EventView(props: { event?: CityEvent; assignment: EventAssignment | null; answer: string; busy: boolean; onAnswer: (value: string) => void; onClaim: () => void; onComplete: () => void; onBack: () => void }) {
  const { event, assignment, answer, busy, onAnswer, onClaim, onComplete, onBack } = props;
  return (
    <div className="screen event-screen">
      <div className="page-head"><button className="text-link" onClick={onBack}>返回</button><span>动态事件</span></div>
      <div className="compact-hero event-hero"><span>城市事件探索</span><h1>{event?.title || '今日事件'}</h1><p>{event?.summary || '正在加载今日城市事件。'}</p></div>
      {assignment ? (
        <>
          <div className="role-card"><span>你的今日身份</span><h2>{assignment.role?.name || '调查员'}</h2><p>{assignment.role?.description || '完成今日事件后会生成专属分享卡。'}</p></div>
          <article className="panel"><h2>{assignment.task.title}</h2><p>{assignment.task.content}</p><small>{assignment.task.locationName} · {assignment.task.taskType.toUpperCase()}</small></article>
          {assignment.task.taskType === 'qa' && assignment.status !== 'completed' && <input className="answer-input" value={answer} onChange={(event) => onAnswer(event.target.value)} placeholder="输入事件密码" />}
          <button className="share-card"><span>事件分享素材</span><strong>{assignment.task.reward?.shareTitle || assignment.event.reward?.shareTitle}</strong></button>
          {assignment.status === 'completed' ? <div className="event-complete-card"><span>EVENT COMPLETE</span><h2>今日事件已归档</h2><p>{assignment.sharePayload?.subtitle || '你完成了一次限时城市事件调查。'}</p></div> : <button className="primary-action sticky" disabled={busy} onClick={onComplete}>{busy ? '验证中...' : assignment.task.taskType === 'qa' ? '提交事件答案' : '模拟完成事件'}</button>}
        </>
      ) : (
        <>
          <article className="panel"><h2>领取后随机分配</h2><p>同一个地点，不同玩家会拿到不同任务和身份，后续可扩展为玩家交换线索、商家信封和真人线人。</p></article>
          <button className="primary-action" disabled={busy || !event} onClick={onClaim}>{busy ? '领取中...' : '领取今日事件'}</button>
        </>
      )}
    </div>
  );
}

function GameView(props: { quest: Quest | null; node?: QuestNode; nextNode?: QuestNode; answer: string; busy: boolean; progressPercent: number; onAnswer: (value: string) => void; onPass: () => void; onFinishTab: () => void }) {
  const { quest, node, nextNode, answer, busy, progressPercent, onAnswer, onPass, onFinishTab } = props;
  if (!quest) return <div className="screen loading">正在加载任务...</div>;
  if (!node) return <div className="screen complete"><span className="badge">MISSION COMPLETE</span><h1>山城核心已解锁</h1><p>恭喜你成为重庆第 17 号调查员，雾都失落档案已完成归档。</p><button className="primary-action" onClick={onFinishTab}>查看调查员身份卡</button></div>;
  return (
    <div className="screen game-screen">
      <div className="mission-head"><div><span>{quest.title}</span><h1>{node.title}</h1></div><b>{node.nodeIndex}/{quest.nodes.length}</b></div>
      <div className="progress"><i style={{ width: `${progressPercent}%` }} /></div>
      <article className="panel signal"><h2>AI 来电 · SC-1938</h2><p>{node.content}</p></article>
      <article className="panel"><h2>当前地点 · {node.reward?.location}</h2><p className="objective">{node.reward?.objective}</p><small>{node.reward?.hint || '按平台任务要求完成当前节点。'}</small></article>
      {node.nodeType === 'gps' && <div className="map-card"><span>地图定位点</span><strong>{node.reward?.location}</strong><small>验证半径 {node.radius || 80}m · H5 演示使用节点坐标模拟到达</small></div>}
      {node.nodeType === 'qa' && <input className="answer-input" value={answer} onChange={(event) => onAnswer(event.target.value)} placeholder="输入调查密码" />}
      {node.nodeType === 'challenge' && (
        <div className="challenge-card">
          <span>{node.reward?.npcRole || '真人 NPC'}</span>
          <h2>闯关规则</h2>
          {(node.reward?.challengeRules || ['说出暗号', '完成限时观察', '领取线索信封']).map((rule, index) => (
            <div className="challenge-rule" key={rule}>
              <i>{index + 1}</i>
              <strong>{rule}</strong>
            </div>
          ))}
          <small>正式版验证：{node.reward?.futureVerify || 'NPC 核销 / 商家扫码 / 小游戏结果'}</small>
        </div>
      )}
      <button className="share-card"><span>可生成分享素材</span><strong>{node.reward?.shareTitle}</strong></button>
      {nextNode && <div className="next-card"><span>下一章预告</span><strong>{nextNode.title}</strong></div>}
      <button className="primary-action sticky" disabled={busy} onClick={onPass}>{busy ? '验证中...' : nodeActionLabel(node)}</button>
    </div>
  );
}

function AchievementView({ records, questTitle, onReload }: { records: any[]; questTitle?: string; onReload: () => void }) {
  const latest = records[0];
  return (
    <div className="screen achievement-screen">
      <div className="compact-hero"><span>雾都会档案</span><h1>调查员身份卡</h1><p>完成真实城市任务后，系统生成专属编号、通关记录与可分享身份卡。</p></div>
      {latest ? <div className="certificate"><span>城市探秘</span><h2>重庆第17号调查员</h2><p>{latest.questTitle || questTitle}</p><div className="cert-line" /><dl><div><dt>玩家</dt><dd>H5 Player</dd></div><div><dt>完成时间</dt><dd>{new Date(latest.finishTime).toLocaleString()}</dd></div><div><dt>证书编号</dt><dd>CQ-SIB-{String(latest.id).padStart(4, '0')}</dd></div></dl><b>PASS</b></div> : <div className="panel empty"><h2>还没有通关记录</h2><p>完成《雾都失落档案》后，这里会展示你的专属调查员身份卡。</p></div>}
      <button className="secondary-action" onClick={onReload}>刷新身份卡记录</button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
