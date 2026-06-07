import {
  AppstoreOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';

const { Header, Sider, Content } = Layout;

type QuestStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'online' | 'offline' | 'suspended';
type Difficulty = 'easy' | 'normal' | 'hard';
type NodeType = 'gps' | 'qa' | 'photo' | 'qr' | 'challenge';
type AdminSection = 'quests' | 'projects' | 'templates' | 'nodes' | 'users' | 'stats';
type MceTemplateType = 'story' | 'challenge' | 'interaction' | 'reward' | 'route';
type MceTemplateStatus = 'active' | 'inactive';
type MceProjectStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'online' | 'offline';

interface NodeReward {
  badge?: string;
  location?: string;
  objective?: string;
  shareTitle?: string;
  hint?: string;
  npcRole?: string;
  secretCode?: string;
  challengeRules?: string[];
  verifyMode?: string;
  futureVerify?: string;
  commissionAmount?: number;
  staffCode?: string;
}

interface QuestNode {
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
  reward?: NodeReward;
  nextNode?: number;
}

interface Quest {
  id: number;
  title: string;
  cover?: string;
  description?: string;
  price: number;
  duration: number;
  distance: number;
  difficulty: Difficulty;
  status: QuestStatus;
  rejectReason?: string;
  nodes: QuestNode[];
}

interface MceTemplate {
  id: number;
  templateType: MceTemplateType;
  code: string;
  name: string;
  audience?: string;
  description?: string;
  config?: Record<string, unknown>;
  status: MceTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

interface MceExperienceRatio {
  cityExploration?: number;
  challengeMechanism?: number;
  realHumanInteraction?: number;
  storyImmersion?: number;
}

interface MceCreatorProject {
  id: number;
  creatorId?: number | null;
  questId?: number | null;
  city: string;
  title: string;
  targetAudience?: string;
  routeTemplateId?: number | null;
  storyTemplateId?: number | null;
  challengeTemplateIds?: number[];
  interactionTemplateIds?: number[];
  rewardTemplateIds?: number[];
  experienceRatio?: MceExperienceRatio;
  status: MceProjectStatus;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Suspended', value: 'suspended' }
];

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Normal', value: 'normal' },
  { label: 'Hard', value: 'hard' }
];

const nodeTypeOptions = [
  { label: 'GPS Check-in', value: 'gps' },
  { label: 'Question', value: 'qa' },
  { label: 'Photo Upload', value: 'photo' },
  { label: 'QR Scan', value: 'qr' },
  { label: 'NPC Challenge', value: 'challenge' }
];

const mceTemplateTypeOptions = [
  { label: 'Story', value: 'story' },
  { label: 'Challenge', value: 'challenge' },
  { label: 'Interaction', value: 'interaction' },
  { label: 'Reward', value: 'reward' },
  { label: 'Route', value: 'route' }
];

const mceTemplateStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
];

const mceProjectStatusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' }
];

const challengeVerifyOptions = [
  { label: 'Staff code', value: 'staff_code' },
  { label: 'NPC QR', value: 'npc_qr' },
  { label: 'Timed challenge', value: 'timed_challenge' },
  { label: 'Mock pass', value: 'mock_pass' }
];

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [adminName, setAdminName] = useState(() => localStorage.getItem('adminName') || '');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [templates, setTemplates] = useState<MceTemplate[]>([]);
  const [projects, setProjects] = useState<MceCreatorProject[]>([]);
  const [activeSection, setActiveSection] = useState<AdminSection>('quests');
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [nodeDrawerOpen, setNodeDrawerOpen] = useState(false);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [editingNode, setEditingNode] = useState<QuestNode | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MceTemplate | null>(null);
  const [editingProject, setEditingProject] = useState<MceCreatorProject | null>(null);
  const [reviewQuest, setReviewQuest] = useState<Quest | null>(null);
  const [reviewAction, setReviewAction] = useState<'reject' | 'suspend' | null>(null);
  const [loginForm] = Form.useForm();
  const [questForm] = Form.useForm();
  const [nodeForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const watchedNodeType = Form.useWatch('nodeType', nodeForm);

  const selectedQuestFresh = useMemo(
    () => quests.find((quest) => quest.id === selectedQuest?.id) || selectedQuest,
    [quests, selectedQuest]
  );

  const loadQuests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await api.get<Quest[]>('/admin/quests');
      setQuests(data);
      if (selectedQuest) {
        setSelectedQuest(data.find((quest) => quest.id === selectedQuest.id) || null);
      }
    } catch {
      message.error('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!token) return;
    setTemplateLoading(true);
    try {
      const { data } = await api.get<MceTemplate[]>('/admin/mce/templates');
      setTemplates(data);
    } catch {
      message.error('Failed to load MCE templates');
    } finally {
      setTemplateLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!token) return;
    setProjectLoading(true);
    try {
      const { data } = await api.get<MceCreatorProject[]>('/admin/mce/projects');
      setProjects(data);
    } catch {
      message.error('Failed to load MCE projects');
    } finally {
      setProjectLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
    loadTemplates();
    loadProjects();
  }, [token]);

  const login = async (values: { username: string; password: string }) => {
    const { data } = await api.post('/admin/login', values);
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminName', data.admin.username);
    setToken(data.token);
    setAdminName(data.admin.username);
    message.success('Logged in');
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    setToken('');
    setAdminName('');
    setQuests([]);
    setTemplates([]);
    setProjects([]);
  };

  const refreshCurrent = async () => {
    if (activeSection === 'projects') {
      await loadProjects();
    } else if (activeSection === 'templates') {
      await loadTemplates();
    } else {
      await loadQuests();
    }
  };

  const templateById = (id?: number | null) => templates.find((template) => template.id === id);

  const templateOptions = (type: MceTemplateType) =>
    templates
      .filter((template) => template.templateType === type && template.status === 'active')
      .map((template) => ({ label: template.name, value: template.id }));

  const projectTemplateNames = (ids?: number[]) => {
    if (!ids?.length) return '-';
    return ids.map((id) => templateById(id)?.name || `#${id}`).join(', ');
  };

  const openCreateQuest = () => {
    setEditingQuest(null);
    questForm.resetFields();
    questForm.setFieldsValue({ price: 39.9, duration: 120, distance: 3.2, difficulty: 'normal', status: 'draft' });
    setQuestModalOpen(true);
  };

  const openEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    questForm.setFieldsValue(quest);
    setQuestModalOpen(true);
  };

  const saveQuest = async () => {
    const values = await questForm.validateFields();
    if (editingQuest) {
      await api.patch(`/admin/quests/${editingQuest.id}`, values);
      message.success('Quest updated');
    } else {
      await api.post('/admin/quests', values);
      message.success('Quest created');
    }
    setQuestModalOpen(false);
    await loadQuests();
  };

  const removeQuest = (quest: Quest) => {
    Modal.confirm({
      title: 'Delete quest',
      content: `Delete "${quest.title}" and all of its nodes?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        await api.delete(`/admin/quests/${quest.id}`);
        message.success('Quest deleted');
        await loadQuests();
      }
    });
  };

  const updateQuestStatus = async (quest: Quest, status: QuestStatus) => {
    await api.patch(`/admin/quests/${quest.id}`, { status });
    message.success(status === 'online' ? 'Quest is online' : 'Quest is offline');
    await loadQuests();
  };

  const submitReview = async (quest: Quest) => {
    await api.post(`/admin/quests/${quest.id}/submit-review`);
    message.success('Quest submitted for review');
    await loadQuests();
  };

  const approveQuest = async (quest: Quest) => {
    await api.post(`/admin/quests/${quest.id}/approve`, { reason: 'Approved' });
    message.success('Quest approved');
    await loadQuests();
  };

  const openReviewModal = (quest: Quest, action: 'reject' | 'suspend') => {
    setReviewQuest(quest);
    setReviewAction(action);
    reviewForm.resetFields();
  };

  const submitReviewAction = async () => {
    if (!reviewQuest || !reviewAction) return;
    const values = await reviewForm.validateFields();
    await api.post(`/admin/quests/${reviewQuest.id}/${reviewAction}`, { reason: values.reason });
    message.success(reviewAction === 'reject' ? 'Quest rejected' : 'Quest suspended');
    setReviewQuest(null);
    setReviewAction(null);
    await loadQuests();
  };

  const openNodes = (quest: Quest) => {
    setSelectedQuest(quest);
    setNodeDrawerOpen(true);
  };

  const openCreateNode = () => {
    const nextIndex = (selectedQuestFresh?.nodes?.length || 0) + 1;
    setEditingNode(null);
    nodeForm.resetFields();
    nodeForm.setFieldsValue({ nodeIndex: nextIndex, nodeType: 'gps', radius: 80, reward: {} });
    setNodeModalOpen(true);
  };

  const openEditNode = (node: QuestNode) => {
    setEditingNode(node);
    nodeForm.setFieldsValue({
      ...node,
      challengeRulesText: node.reward?.challengeRules?.join('\n') || ''
    });
    setNodeModalOpen(true);
  };

  const saveNode = async () => {
    if (!selectedQuestFresh) return;
    const values = await nodeForm.validateFields();
    const { challengeRulesText, reward, ...rest } = values;
    const payload: Record<string, unknown> = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, value === '' ? undefined : value])
    );
    if (values.nodeType === 'challenge') {
      payload.reward = {
        ...(editingNode?.reward || {}),
        ...(reward || {}),
        verifyMode: 'challenge',
        challengeRules: String(challengeRulesText || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      };
    } else if (reward && Object.keys(reward).some((key) => reward[key] !== undefined && reward[key] !== '')) {
      payload.reward = reward;
    }
    if (editingNode) {
      await api.patch(`/admin/nodes/${editingNode.id}`, payload);
      message.success('Node updated');
    } else {
      await api.post(`/admin/quests/${selectedQuestFresh.id}/nodes`, payload);
      message.success('Node created');
    }
    setNodeModalOpen(false);
    await loadQuests();
  };

  const removeNode = (node: QuestNode) => {
    Modal.confirm({
      title: 'Delete node',
      content: `Delete node "${node.title}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        await api.delete(`/admin/nodes/${node.id}`);
        message.success('Node deleted');
        await loadQuests();
      }
    });
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      templateType: 'story',
      status: 'active',
      configText: '{}'
    });
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (template: MceTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({
      ...template,
      configText: JSON.stringify(template.config || {}, null, 2)
    });
    setTemplateModalOpen(true);
  };

  const saveTemplate = async () => {
    const values = await templateForm.validateFields();
    let config: Record<string, unknown> | undefined;
    try {
      config = values.configText ? JSON.parse(values.configText) : {};
    } catch {
      message.error('Config must be valid JSON');
      return;
    }
    const payload = {
      templateType: values.templateType,
      code: values.code,
      name: values.name,
      audience: values.audience,
      description: values.description,
      status: values.status,
      config
    };
    if (editingTemplate) {
      await api.patch(`/admin/mce/templates/${editingTemplate.id}`, payload);
      message.success('Template updated');
    } else {
      await api.post('/admin/mce/templates', payload);
      message.success('Template created');
    }
    setTemplateModalOpen(false);
    await loadTemplates();
  };

  const updateTemplateStatus = async (template: MceTemplate, status: MceTemplateStatus) => {
    await api.patch(`/admin/mce/templates/${template.id}`, { status });
    message.success(status === 'active' ? 'Template activated' : 'Template deactivated');
    await loadTemplates();
  };

  const removeTemplate = (template: MceTemplate) => {
    Modal.confirm({
      title: 'Delete template',
      content: `Delete template "${template.name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        await api.delete(`/admin/mce/templates/${template.id}`);
        message.success('Template deleted');
        await loadTemplates();
      }
    });
  };

  const openCreateProject = () => {
    setEditingProject(null);
    projectForm.resetFields();
    projectForm.setFieldsValue({
      city: 'Chongqing',
      status: 'draft',
      experienceRatio: {
        cityExploration: 20,
        challengeMechanism: 30,
        realHumanInteraction: 30,
        storyImmersion: 20
      }
    });
    setProjectModalOpen(true);
  };

  const openEditProject = (project: MceCreatorProject) => {
    setEditingProject(project);
    projectForm.setFieldsValue({
      ...project,
      experienceRatio: {
        cityExploration: project.experienceRatio?.cityExploration ?? 20,
        challengeMechanism: project.experienceRatio?.challengeMechanism ?? 30,
        realHumanInteraction: project.experienceRatio?.realHumanInteraction ?? 30,
        storyImmersion: project.experienceRatio?.storyImmersion ?? 20
      }
    });
    setProjectModalOpen(true);
  };

  const saveProject = async () => {
    const values = await projectForm.validateFields();
    const payload = {
      city: values.city,
      title: values.title,
      targetAudience: values.targetAudience,
      routeTemplateId: values.routeTemplateId || null,
      storyTemplateId: values.storyTemplateId || null,
      challengeTemplateIds: values.challengeTemplateIds || [],
      interactionTemplateIds: values.interactionTemplateIds || [],
      rewardTemplateIds: values.rewardTemplateIds || [],
      experienceRatio: values.experienceRatio,
      status: values.status
    };
    if (editingProject) {
      await api.patch(`/admin/mce/projects/${editingProject.id}`, payload);
      message.success('Project draft updated');
    } else {
      await api.post('/admin/mce/projects', payload);
      message.success('Project draft created');
    }
    setProjectModalOpen(false);
    await loadProjects();
  };

  const removeProject = (project: MceCreatorProject) => {
    Modal.confirm({
      title: 'Delete project draft',
      content: `Delete project draft "${project.title}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        await api.delete(`/admin/mce/projects/${project.id}`);
        message.success('Project draft deleted');
        await loadProjects();
      }
    });
  };

  const questColumns: ColumnsType<Quest> = [
    { title: 'Quest', dataIndex: 'title', width: 220 },
    { title: 'Price', dataIndex: 'price', width: 100, render: (value) => `CNY ${value}` },
    { title: 'Duration', dataIndex: 'duration', width: 110, render: (value) => `${value} min` },
    { title: 'Distance', dataIndex: 'distance', width: 100, render: (value) => `${value} km` },
    { title: 'Difficulty', dataIndex: 'difficulty', width: 100 },
    { title: 'Nodes', dataIndex: 'nodes', width: 80, render: (nodes: QuestNode[]) => nodes?.length || 0 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 90,
      render: (value: QuestStatus) => {
        const colorMap: Record<QuestStatus, string> = {
          draft: 'blue',
          pending_review: 'gold',
          approved: 'cyan',
          rejected: 'red',
          online: 'green',
          offline: 'default',
          suspended: 'volcano'
        };
        return <Tag color={colorMap[value]}>{value}</Tag>;
      }
    },
    { title: 'Review note', dataIndex: 'rejectReason', width: 160, render: (value) => value || '-' },
    {
      title: 'Actions',
      width: 470,
      render: (_, quest) => (
        <Space>
          <Button size='small' onClick={() => openEditQuest(quest)}>Edit</Button>
          <Button size='small' onClick={() => openNodes(quest)}>Nodes</Button>
          {['draft', 'rejected', 'offline'].includes(quest.status) && (
            <Button size='small' onClick={() => submitReview(quest)}>Submit</Button>
          )}
          {quest.status === 'pending_review' && (
            <>
              <Button size='small' type='primary' onClick={() => approveQuest(quest)}>Approve</Button>
              <Button size='small' danger onClick={() => openReviewModal(quest, 'reject')}>Reject</Button>
            </>
          )}
          {quest.status === 'online' ? (
            <Button size='small' onClick={() => updateQuestStatus(quest, 'offline')}>Offline</Button>
          ) : ['approved', 'offline'].includes(quest.status) ? (
            <Button size='small' type='primary' onClick={() => updateQuestStatus(quest, 'online')}>Online</Button>
          ) : null}
          {quest.status !== 'suspended' && (
            <Button size='small' danger onClick={() => openReviewModal(quest, 'suspend')}>Suspend</Button>
          )}
          <Button size='small' danger onClick={() => removeQuest(quest)}>Delete</Button>
        </Space>
      )
    }
  ];

  const nodeColumns: ColumnsType<QuestNode> = [
    { title: 'Index', dataIndex: 'nodeIndex', width: 70 },
    { title: 'Type', dataIndex: 'nodeType', width: 110, render: (value) => <Tag>{value}</Tag> },
    { title: 'Title', dataIndex: 'title', width: 180 },
    { title: 'GPS', width: 190, render: (_, node) => node.nodeType === 'gps' ? `${node.lat || '-'}, ${node.lng || '-'} / ${node.radius || '-'}m` : '-' },
    { title: 'Answer', dataIndex: 'answer', width: 120, render: (value) => value || '-' },
    {
      title: 'NPC',
      width: 170,
      render: (_, node) => node.nodeType === 'challenge'
        ? (
          <Space direction='vertical' size={0}>
            <span>{node.reward?.npcRole || '-'}</span>
            <Tag color='orange'>{node.reward?.verifyMode || node.reward?.futureVerify || 'challenge'}</Tag>
          </Space>
        )
        : '-'
    },
    {
      title: 'Commission',
      width: 110,
      render: (_, node) => node.nodeType === 'challenge' ? `CNY ${node.reward?.commissionAmount || 0}` : '-'
    },
    { title: 'Next', dataIndex: 'nextNode', width: 100, render: (value) => value || '-' },
    {
      title: 'Actions',
      width: 150,
      render: (_, node) => (
        <Space>
          <Button size='small' onClick={() => openEditNode(node)}>Edit</Button>
          <Button size='small' danger onClick={() => removeNode(node)}>Delete</Button>
        </Space>
      )
    }
  ];

  const templateColumns: ColumnsType<MceTemplate> = [
    {
      title: 'Type',
      dataIndex: 'templateType',
      width: 120,
      render: (value: MceTemplateType) => <Tag color='blue'>{value}</Tag>
    },
    { title: 'Name', dataIndex: 'name', width: 180 },
    { title: 'Code', dataIndex: 'code', width: 190 },
    { title: 'Audience', dataIndex: 'audience', width: 180, render: (value) => value || '-' },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (value: MceTemplateStatus) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>
    },
    {
      title: 'Actions',
      width: 250,
      render: (_, template) => (
        <Space>
          <Button size='small' onClick={() => openEditTemplate(template)}>Edit</Button>
          {template.status === 'active' ? (
            <Button size='small' onClick={() => updateTemplateStatus(template, 'inactive')}>Deactivate</Button>
          ) : (
            <Button size='small' type='primary' onClick={() => updateTemplateStatus(template, 'active')}>Activate</Button>
          )}
          <Button size='small' danger onClick={() => removeTemplate(template)}>Delete</Button>
        </Space>
      )
    }
  ];

  const projectColumns: ColumnsType<MceCreatorProject> = [
    { title: 'Project', dataIndex: 'title', width: 240 },
    { title: 'City', dataIndex: 'city', width: 110 },
    { title: 'Audience', dataIndex: 'targetAudience', width: 190, render: (value) => value || '-' },
    {
      title: 'Core templates',
      width: 280,
      render: (_, project) => (
        <Space direction='vertical' size={0}>
          <span>Route: {templateById(project.routeTemplateId)?.name || '-'}</span>
          <span>Story: {templateById(project.storyTemplateId)?.name || '-'}</span>
        </Space>
      )
    },
    {
      title: 'Challenge / Interaction / Reward',
      ellipsis: true,
      render: (_, project) => (
        <Space direction='vertical' size={0}>
          <span>Challenge: {projectTemplateNames(project.challengeTemplateIds)}</span>
          <span>Interaction: {projectTemplateNames(project.interactionTemplateIds)}</span>
          <span>Reward: {projectTemplateNames(project.rewardTemplateIds)}</span>
        </Space>
      )
    },
    {
      title: 'Ratio',
      width: 210,
      render: (_, project) => {
        const ratio = project.experienceRatio || {};
        return `${ratio.cityExploration ?? 0}/${ratio.challengeMechanism ?? 0}/${ratio.realHumanInteraction ?? 0}/${ratio.storyImmersion ?? 0}`;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: MceProjectStatus) => {
        const colorMap: Record<MceProjectStatus, string> = {
          draft: 'blue',
          pending_review: 'gold',
          approved: 'cyan',
          rejected: 'red',
          online: 'green',
          offline: 'default'
        };
        return <Tag color={colorMap[value]}>{value}</Tag>;
      }
    },
    {
      title: 'Actions',
      width: 150,
      render: (_, project) => (
        <Space>
          <Button size='small' onClick={() => openEditProject(project)}>Edit</Button>
          <Button size='small' danger onClick={() => removeProject(project)}>Delete</Button>
        </Space>
      )
    }
  ];

  if (!token) {
    return (
      <div className='login-page'>
        <div className='login-panel'>
          <Typography.Title level={3}>Chongqing City Quest</Typography.Title>
          <Typography.Text type='secondary'>Admin login</Typography.Text>
          <Form form={loginForm} layout='vertical' onFinish={login} initialValues={{ username: 'admin' }}>
            <Form.Item name='username' label='Username' rules={[{ required: true, message: 'Username is required' }]}>
              <Input placeholder='admin' />
            </Form.Item>
            <Form.Item name='password' label='Password' rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password placeholder='ChangeMe123!' />
            </Form.Item>
            <Button block type='primary' htmlType='submit'>Login</Button>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <Layout className='shell'>
      <Sider width={220} theme='light'>
        <div className='brand'>City Quest Admin</div>
        <Menu
          mode='inline'
          selectedKeys={[activeSection]}
          onClick={({ key }) => setActiveSection(key as AdminSection)}
          items={[
            { key: 'quests', icon: <EnvironmentOutlined />, label: 'Quests' },
            { key: 'projects', icon: <FileTextOutlined />, label: 'MCE Projects' },
            { key: 'templates', icon: <AppstoreOutlined />, label: 'MCE Templates' },
            { key: 'nodes', icon: <OrderedListOutlined />, label: 'Nodes' },
            { key: 'users', icon: <UserOutlined />, label: 'Users' },
            { key: 'stats', icon: <BarChartOutlined />, label: 'Stats' }
          ]}
        />
      </Sider>
      <Layout>
        <Header className='header'>
          <Typography.Title level={4}>
            {activeSection === 'projects'
              ? 'MCE Creator Projects'
              : activeSection === 'templates'
                ? 'MCE Template Library'
                : 'Quest Management'}
          </Typography.Title>
          <Space>
            <span className='admin-name'>{adminName}</span>
            <Button icon={<ReloadOutlined />} onClick={refreshCurrent}>Refresh</Button>
            <Button icon={<LogoutOutlined />} onClick={logout}>Logout</Button>
            {activeSection === 'projects' ? (
              <Button type='primary' icon={<PlusOutlined />} onClick={openCreateProject}>New Project</Button>
            ) : activeSection === 'templates' ? (
              <Button type='primary' icon={<PlusOutlined />} onClick={openCreateTemplate}>New Template</Button>
            ) : (
              <Button type='primary' icon={<PlusOutlined />} onClick={openCreateQuest}>New Quest</Button>
            )}
          </Space>
        </Header>
        <Content className='content'>
          <div className='table-wrap'>
            {activeSection === 'projects' ? (
              <Space direction='vertical' size={16} className='full-width'>
                <Descriptions size='small' column={4}>
                  <Descriptions.Item label='Total projects'>{projects.length}</Descriptions.Item>
                  <Descriptions.Item label='Draft'>{projects.filter((project) => project.status === 'draft').length}</Descriptions.Item>
                  <Descriptions.Item label='Pending review'>{projects.filter((project) => project.status === 'pending_review').length}</Descriptions.Item>
                  <Descriptions.Item label='Cities'>{new Set(projects.map((project) => project.city)).size}</Descriptions.Item>
                </Descriptions>
                <Table rowKey='id' loading={projectLoading} dataSource={projects} columns={projectColumns} pagination={{ pageSize: 10 }} />
              </Space>
            ) : activeSection === 'templates' ? (
              <Space direction='vertical' size={16} className='full-width'>
                <Descriptions size='small' column={4}>
                  <Descriptions.Item label='Total templates'>{templates.length}</Descriptions.Item>
                  <Descriptions.Item label='Active'>{templates.filter((template) => template.status === 'active').length}</Descriptions.Item>
                  <Descriptions.Item label='Types'>{new Set(templates.map((template) => template.templateType)).size}</Descriptions.Item>
                  <Descriptions.Item label='Engine'>MCE V1.0</Descriptions.Item>
                </Descriptions>
                <Table rowKey='id' loading={templateLoading} dataSource={templates} columns={templateColumns} pagination={{ pageSize: 10 }} />
              </Space>
            ) : (
              <Space direction='vertical' size={16} className='full-width'>
                <Descriptions size='small' column={4}>
                  <Descriptions.Item label='Total quests'>{quests.length}</Descriptions.Item>
                  <Descriptions.Item label='Pending review'>{quests.filter((quest) => quest.status === 'pending_review').length}</Descriptions.Item>
                  <Descriptions.Item label='Total nodes'>{quests.reduce((sum, quest) => sum + (quest.nodes?.length || 0), 0)}</Descriptions.Item>
                  <Descriptions.Item label='API'>{import.meta.env.VITE_API_BASE || 'http://127.0.0.1:3001/api'}</Descriptions.Item>
                </Descriptions>
                <Table rowKey='id' loading={loading} dataSource={quests} columns={questColumns} pagination={{ pageSize: 8 }} />
              </Space>
            )}
          </div>
        </Content>
      </Layout>

      <Modal title={editingQuest ? 'Edit quest' : 'New quest'} open={questModalOpen} okText='Save' cancelText='Cancel' onOk={saveQuest} onCancel={() => setQuestModalOpen(false)} destroyOnClose>
        <Form form={questForm} layout='vertical'>
          <Form.Item name='title' label='Title' rules={[{ required: true, message: 'Title is required' }]}><Input /></Form.Item>
          <Form.Item name='cover' label='Cover URL'><Input /></Form.Item>
          <Form.Item name='description' label='Description'><Input.TextArea rows={4} /></Form.Item>
          <div className='form-grid'>
            <Form.Item name='price' label='Price' rules={[{ required: true }]}><InputNumber min={0} precision={2} className='full-width' /></Form.Item>
            <Form.Item name='duration' label='Duration (min)' rules={[{ required: true }]}><InputNumber min={0} className='full-width' /></Form.Item>
            <Form.Item name='distance' label='Distance (km)' rules={[{ required: true }]}><InputNumber min={0} precision={2} className='full-width' /></Form.Item>
          </div>
          <div className='form-grid two'>
            <Form.Item name='difficulty' label='Difficulty' rules={[{ required: true }]}><Select options={difficultyOptions} /></Form.Item>
            <Form.Item name='status' label='Status' rules={[{ required: true }]}><Select options={statusOptions} /></Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={reviewAction === 'reject' ? 'Reject quest' : 'Suspend quest'}
        open={!!reviewAction}
        okText={reviewAction === 'reject' ? 'Reject' : 'Suspend'}
        okButtonProps={{ danger: true }}
        cancelText='Cancel'
        onOk={submitReviewAction}
        onCancel={() => {
          setReviewQuest(null);
          setReviewAction(null);
        }}
        destroyOnClose
      >
        <Form form={reviewForm} layout='vertical'>
          <Form.Item name='reason' label='Reason' rules={[{ required: true, message: 'Reason is required' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal width={820} title={editingProject ? 'Edit MCE project draft' : 'New MCE project draft'} open={projectModalOpen} okText='Save' cancelText='Cancel' onOk={saveProject} onCancel={() => setProjectModalOpen(false)} destroyOnClose>
        <Form form={projectForm} layout='vertical'>
          <div className='form-grid two'>
            <Form.Item name='title' label='Project title' rules={[{ required: true, message: 'Project title is required' }]}>
              <Input placeholder='Fog City Contact Trial' />
            </Form.Item>
            <Form.Item name='city' label='City' rules={[{ required: true, message: 'City is required' }]}>
              <Select
                showSearch
                options={[
                  { label: 'Chongqing', value: 'Chongqing' },
                  { label: 'Chengdu', value: 'Chengdu' },
                  { label: 'Shanghai', value: 'Shanghai' },
                  { label: 'Guangzhou', value: 'Guangzhou' },
                  { label: 'Beijing', value: 'Beijing' }
                ]}
              />
            </Form.Item>
          </div>
          <div className='form-grid two'>
            <Form.Item name='targetAudience' label='Target audience'>
              <Input placeholder='Young travelers / mystery players' />
            </Form.Item>
            <Form.Item name='status' label='Status' rules={[{ required: true }]}>
              <Select options={mceProjectStatusOptions} />
            </Form.Item>
          </div>
          <Divider orientation='left'>Core template assembly</Divider>
          <div className='form-grid two'>
            <Form.Item name='routeTemplateId' label='Route template'>
              <Select allowClear options={templateOptions('route')} />
            </Form.Item>
            <Form.Item name='storyTemplateId' label='Story template'>
              <Select allowClear options={templateOptions('story')} />
            </Form.Item>
          </div>
          <Form.Item name='challengeTemplateIds' label='Challenge templates'>
            <Select mode='multiple' allowClear options={templateOptions('challenge')} />
          </Form.Item>
          <Form.Item name='interactionTemplateIds' label='Real-human interaction templates'>
            <Select mode='multiple' allowClear options={templateOptions('interaction')} />
          </Form.Item>
          <Form.Item name='rewardTemplateIds' label='Reward templates'>
            <Select mode='multiple' allowClear options={templateOptions('reward')} />
          </Form.Item>
          <Divider orientation='left'>Experience ratio</Divider>
          <div className='form-grid four'>
            <Form.Item name={['experienceRatio', 'cityExploration']} label='City exploration'>
              <InputNumber min={0} max={100} className='full-width' addonAfter='%' />
            </Form.Item>
            <Form.Item name={['experienceRatio', 'challengeMechanism']} label='Challenge'>
              <InputNumber min={0} max={100} className='full-width' addonAfter='%' />
            </Form.Item>
            <Form.Item name={['experienceRatio', 'realHumanInteraction']} label='NPC / people'>
              <InputNumber min={0} max={100} className='full-width' addonAfter='%' />
            </Form.Item>
            <Form.Item name={['experienceRatio', 'storyImmersion']} label='Story'>
              <InputNumber min={0} max={100} className='full-width' addonAfter='%' />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal width={760} title={editingTemplate ? 'Edit MCE template' : 'New MCE template'} open={templateModalOpen} okText='Save' cancelText='Cancel' onOk={saveTemplate} onCancel={() => setTemplateModalOpen(false)} destroyOnClose>
        <Form form={templateForm} layout='vertical'>
          <div className='form-grid two'>
            <Form.Item name='templateType' label='Template type' rules={[{ required: true }]}>
              <Select options={mceTemplateTypeOptions} />
            </Form.Item>
            <Form.Item name='status' label='Status' rules={[{ required: true }]}>
              <Select options={mceTemplateStatusOptions} />
            </Form.Item>
          </div>
          <div className='form-grid two'>
            <Form.Item name='name' label='Name' rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder='失踪案件' />
            </Form.Item>
            <Form.Item name='code' label='Code' rules={[{ required: true, message: 'Code is required' }]}>
              <Input placeholder='story_missing_case' />
            </Form.Item>
          </div>
          <Form.Item name='audience' label='Audience'>
            <Input placeholder='悬疑玩家 / 城市探秘用户' />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name='configText' label='Config JSON'>
            <Input.TextArea rows={10} spellCheck={false} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer width={920} title={selectedQuestFresh ? `Nodes: ${selectedQuestFresh.title}` : 'Nodes'} open={nodeDrawerOpen} onClose={() => setNodeDrawerOpen(false)} extra={<Button type='primary' icon={<PlusOutlined />} onClick={openCreateNode}>New Node</Button>}>
        <Table rowKey='id' dataSource={selectedQuestFresh?.nodes || []} columns={nodeColumns} pagination={false} />
      </Drawer>

      <Modal width={720} title={editingNode ? 'Edit node' : 'New node'} open={nodeModalOpen} okText='Save' cancelText='Cancel' onOk={saveNode} onCancel={() => setNodeModalOpen(false)} destroyOnClose>
        <Form form={nodeForm} layout='vertical'>
          <div className='form-grid'>
            <Form.Item name='nodeIndex' label='Index' rules={[{ required: true }]}><InputNumber min={1} className='full-width' /></Form.Item>
            <Form.Item name='nodeType' label='Type' rules={[{ required: true }]}><Select options={nodeTypeOptions} /></Form.Item>
            <Form.Item name='nextNode' label='Next node ID'><InputNumber min={1} className='full-width' placeholder='Empty means finish' /></Form.Item>
          </div>
          <Form.Item name='title' label='Title' rules={[{ required: true, message: 'Title is required' }]}><Input /></Form.Item>
          <Form.Item name='content' label='Story / task'><Input.TextArea rows={4} /></Form.Item>
          <div className='form-grid'>
            <Form.Item name='lat' label='Latitude'><InputNumber precision={6} className='full-width' /></Form.Item>
            <Form.Item name='lng' label='Longitude'><InputNumber precision={6} className='full-width' /></Form.Item>
            <Form.Item name='radius' label='Radius (m)'><InputNumber min={1} className='full-width' /></Form.Item>
          </div>
          <Form.Item name='answer' label='QA answer'><Input /></Form.Item>
          <Divider orientation='left'>NPC challenge configuration</Divider>
          <Typography.Paragraph type='secondary'>
            These fields are used when node type is NPC Challenge. They are saved into node reward JSON and can later be migrated to a dedicated NPC task table.
          </Typography.Paragraph>
          <div className='form-grid two'>
            <Form.Item name={['reward', 'npcRole']} label='NPC role'>
              <Input placeholder='雾都会线人' disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
            <Form.Item name={['reward', 'secretCode']} label='Secret code'>
              <Input placeholder='雾起山城' disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
          </div>
          <Form.Item name='challengeRulesText' label='Challenge rules'>
            <Input.TextArea
              rows={4}
              disabled={watchedNodeType !== 'challenge'}
              placeholder={'One rule per line, for example:\nSay the secret code\nFind three marks in 60 seconds\nCollect the envelope'}
            />
          </Form.Item>
          <div className='form-grid'>
            <Form.Item name={['reward', 'futureVerify']} label='Verify method'>
              <Select options={challengeVerifyOptions} disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
            <Form.Item name={['reward', 'staffCode']} label='Staff/NPC code'>
              <Input placeholder='NPC-1938' disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
            <Form.Item name={['reward', 'commissionAmount']} label='NPC commission'>
              <InputNumber min={0} precision={2} className='full-width' disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
          </div>
          <div className='form-grid two'>
            <Form.Item name={['reward', 'objective']} label='Challenge objective'>
              <Input disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
            <Form.Item name={['reward', 'shareTitle']} label='Share title'>
              <Input disabled={watchedNodeType !== 'challenge'} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
