import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const questId = 1n;

const s1Nodes = [
  {
    nodeIndex: 1,
    nodeType: 'photo',
    title: '第一章 消失的时间',
    content:
      '2027 年，重庆城市更新工程中发现神秘档案 SC-1938。档案最后一次出现于解放碑。请前往现场，找到老重庆照片的相似角度，拍照上传，唤醒第一段时间碎片。',
    lat: 29.56301,
    lng: 106.57712,
    radius: 80,
    reward: {
      location: '解放碑',
      duration: 20,
      objective: '寻找老重庆照片的相似角度，并完成拍照上传',
      verifyMode: 'photo',
      shareTitle: '我找到了一张消失89年的照片',
      badge: '时间碎片'
    }
  },
  {
    nodeIndex: 2,
    nodeType: 'qa',
    title: '第二章 迷失的楼层',
    content:
      '档案记载：白象居存在一个不存在的楼层。你需要在楼道、编号和观察点之间找到异常标记，破解雾都会留下的第二把钥匙。',
    lat: 29.55803,
    lng: 106.5862,
    radius: 80,
    answer: '8D',
    reward: {
      location: '白象居',
      duration: 30,
      objective: '按照提示寻找隐藏楼层、特殊编号和观察点',
      verifyMode: 'qa',
      hint: 'MVP 演示答案：8D',
      shareTitle: '重庆最魔幻建筑被我破解了',
      badge: '魔幻楼层探索者'
    }
  },
  {
    nodeIndex: 3,
    nodeType: 'gps',
    title: '第三章 跨江追踪',
    content:
      '嫌疑人正携带档案跨江逃离。系统开启 30 分钟倒计时。你需要抵达长江索道任务点，完成索道签到，并在对岸寻找特殊图案线索。',
    lat: 29.55883,
    lng: 106.58795,
    radius: 100,
    reward: {
      location: '长江索道',
      duration: 25,
      objective: '在倒计时内抵达索道任务点并完成 GPS 签到',
      verifyMode: 'gps',
      countdownMinutes: 30,
      shareTitle: '我在重庆追捕了一名神秘人',
      badge: '跨江追踪者'
    }
  },
  {
    nodeIndex: 4,
    nodeType: 'qa',
    title: '第四章 洪崖密码',
    content:
      '真正的档案密码隐藏于洪崖洞。根据提示寻找 A、B、C 三个观察点，每个点都会给出一个数字。组合数字，破解第四把钥匙。',
    lat: 29.56263,
    lng: 106.58605,
    radius: 80,
    answer: '713',
    reward: {
      location: '洪崖洞',
      duration: 30,
      objective: '找到三个观察点，组合数字并输入密码',
      verifyMode: 'qa',
      hint: 'MVP 演示答案：713',
      shareTitle: '洪崖洞隐藏密码被我解开了',
      badge: '洪崖密码破译者'
    }
  },
  {
    nodeIndex: 5,
    nodeType: 'challenge',
    title: '线人试炼 NPC 闯关',
    content:
      '雾都会线人只会把最后一段线索交给真正的调查员。请前往线人接头点，完成三段式闯关：说出暗号、完成 60 秒观察挑战、领取神秘信封。MVP 阶段点击按钮模拟 NPC 核销通过。',
    lat: 29.5589,
    lng: 106.5868,
    radius: 80,
    reward: {
      location: '洪崖洞线人点',
      duration: 15,
      objective: '与真人 NPC / 商家线人完成暗号接头和限时观察挑战',
      verifyMode: 'challenge',
      npcRole: '雾都会线人',
      secretCode: '雾起山城',
      challengeRules: ['说出暗号：雾起山城', '60 秒内找出现场三个异常标记', '领取神秘信封并完成核销'],
      futureVerify: 'npc_qr_or_staff_code',
      staffCode: 'NPC-1938',
      commissionAmount: 30,
      shareTitle: '我通过了雾都会线人试炼',
      badge: '线人试炼通过者'
    }
  },
  {
    nodeIndex: 6,
    nodeType: 'qa',
    title: '第五章 山城核心',
    content:
      '五把钥匙已经集齐。你需要把前面获得的数字、照片、密码和线人信封重新组合，输入最终答案。系统将解锁山城核心，并生成调查员身份卡。',
    lat: 29.5531,
    lng: 106.5742,
    radius: 80,
    answer: 'SC1938',
    reward: {
      location: '十八梯',
      duration: 30,
      objective: '完成钥匙拼图，输入最终答案，解锁山城核心',
      verifyMode: 'qa',
      hint: 'MVP 演示答案：SC1938',
      shareTitle: '成功解锁山城核心',
      shareAltTitle: '重庆第17号调查员认证',
      badge: '重庆编号调查员',
      certificateTitle: '重庆第17号调查员'
    }
  }
];

async function seedQuest() {
  await prisma.questNode.deleteMany({ where: { questId } });

  const defaultCommissionRule = await prisma.commissionRule.upsert({
    where: { id: 1n },
    update: {
      name: '默认剧本分佣',
      platformRate: 30,
      creatorRate: 70,
      npcBudgetRate: 0,
      paymentFeeRate: 0.6,
      status: 'active'
    },
    create: {
      id: 1n,
      name: '默认剧本分佣',
      platformRate: 30,
      creatorRate: 70,
      npcBudgetRate: 0,
      paymentFeeRate: 0.6,
      status: 'active'
    }
  });

  const quest = await prisma.quest.upsert({
    where: { id: questId },
    update: {
      title: '雾都失落档案',
      cover: '',
      description:
        '2027 年，重庆城市更新工程中发现神秘档案 SC-1938。档案记载，抗战时期重庆地下曾存在秘密组织“雾都会”，他们在城市各处留下五把钥匙。你是最新被招募的调查员，需要在解放碑、白象居、长江索道、洪崖洞和十八梯之间集齐钥匙，破解真人线人试炼，最终解锁山城核心。',
      city: '重庆',
      season: 'S1',
      price: 39.9,
      commissionRuleId: defaultCommissionRule.id,
      duration: 150,
      distance: 5.8,
      difficulty: '进阶',
      status: 'online',
      config: {
        playerRole: '雾都会档案调查员',
        archiveNo: 'SC-1938',
        coreGoal: '集齐五把钥匙，通过线人试炼，解锁山城核心',
        productType: 'MMOCG',
        experienceRatio: {
          cityExploration: 20,
          challengeMechanism: 30,
          realHumanInteraction: 30,
          storyImmersion: 20
        },
        routeArea: ['解放碑', '白象居', '长江索道', '洪崖洞', '洪崖洞线人点', '十八梯'],
        chapterDesign: [
          {
            chapter: '消失的档案',
            cityExploration: '寻找老照片位置',
            challenge: '20 分钟内完成照片角度复原',
            realHumanInteraction: '找到线人接头，获得第一段暗号',
            story: '档案失踪，调查员被召集'
          },
          {
            chapter: '白象居迷城',
            cityExploration: '寻找隐藏楼层',
            challenge: '迷宫竞速与异常编号识别',
            realHumanInteraction: '与其他玩家交换不同线索',
            story: '发现第二把钥匙'
          },
          {
            chapter: '跨江追击',
            cityExploration: '索道线路追踪',
            challenge: '30 分钟跨江追踪',
            realHumanInteraction: '寻找索道终点附近 NPC',
            story: '发现幕后组织正在转移档案'
          },
          {
            chapter: '洪崖密码',
            cityExploration: '三处观察点',
            challenge: '组合数字密码，辨认真伪线索',
            realHumanInteraction: '团队协作确认最终数字',
            story: '最终档案出现'
          },
          {
            chapter: '山城核心',
            cityExploration: '十八梯终点',
            challenge: '最终 Boss 任务',
            realHumanInteraction: '多人合作完成最后核验',
            story: '揭开山城核心真相'
          }
        ],
        npcChallenge: {
          title: '线人试炼',
          mode: '真人 NPC / 商家线人 / 开发模式模拟',
          verifyModes: ['staff_code', 'npc_qr', 'timed_challenge', 'mock_pass']
        },
        hiddenTasks: ['寻找重庆最窄楼梯', '寻找白象居最佳机位', '寻找洪崖洞真正七楼', '寻找最美索道照片', '寻找十八梯秘密门牌'],
        shareDesign: ['1938 VS 2027 对比图', '魔幻建筑成就卡', '跨江追踪行动卡', '洪崖密码破解卡', '线人试炼通过卡', '调查员身份卡']
      }
    },
    create: {
      id: questId,
      title: '雾都失落档案',
      cover: '',
      description:
        '2027 年，重庆城市更新工程中发现神秘档案 SC-1938。档案记载，抗战时期重庆地下曾存在秘密组织“雾都会”，他们在城市各处留下五把钥匙。你是最新被招募的调查员，需要在解放碑、白象居、长江索道、洪崖洞和十八梯之间集齐钥匙，破解真人线人试炼，最终解锁山城核心。',
      city: '重庆',
      season: 'S1',
      price: 39.9,
      commissionRuleId: defaultCommissionRule.id,
      duration: 150,
      distance: 5.8,
      difficulty: '进阶',
      status: 'online',
      config: {
        playerRole: '雾都会档案调查员',
        archiveNo: 'SC-1938',
        coreGoal: '集齐五把钥匙，通过线人试炼，解锁山城核心',
        productType: 'MMOCG',
        experienceRatio: {
          cityExploration: 20,
          challengeMechanism: 30,
          realHumanInteraction: 30,
          storyImmersion: 20
        },
        routeArea: ['解放碑', '白象居', '长江索道', '洪崖洞', '洪崖洞线人点', '十八梯'],
        chapterDesign: [
          {
            chapter: '消失的档案',
            cityExploration: '寻找老照片位置',
            challenge: '20 分钟内完成照片角度复原',
            realHumanInteraction: '找到线人接头，获得第一段暗号',
            story: '档案失踪，调查员被召集'
          },
          {
            chapter: '白象居迷城',
            cityExploration: '寻找隐藏楼层',
            challenge: '迷宫竞速与异常编号识别',
            realHumanInteraction: '与其他玩家交换不同线索',
            story: '发现第二把钥匙'
          },
          {
            chapter: '跨江追击',
            cityExploration: '索道线路追踪',
            challenge: '30 分钟跨江追踪',
            realHumanInteraction: '寻找索道终点附近 NPC',
            story: '发现幕后组织正在转移档案'
          },
          {
            chapter: '洪崖密码',
            cityExploration: '三处观察点',
            challenge: '组合数字密码，辨认真伪线索',
            realHumanInteraction: '团队协作确认最终数字',
            story: '最终档案出现'
          },
          {
            chapter: '山城核心',
            cityExploration: '十八梯终点',
            challenge: '最终 Boss 任务',
            realHumanInteraction: '多人合作完成最后核验',
            story: '揭开山城核心真相'
          }
        ],
        npcChallenge: {
          title: '线人试炼',
          mode: '真人 NPC / 商家线人 / 开发模式模拟',
          verifyModes: ['staff_code', 'npc_qr', 'timed_challenge', 'mock_pass']
        },
        hiddenTasks: ['寻找重庆最窄楼梯', '寻找白象居最佳机位', '寻找洪崖洞真正七楼', '寻找最美索道照片', '寻找十八梯秘密门牌'],
        shareDesign: ['1938 VS 2027 对比图', '魔幻建筑成就卡', '跨江追踪行动卡', '洪崖密码破解卡', '线人试炼通过卡', '调查员身份卡']
      }
    }
  });

  const createdNodes = [];
  for (const node of s1Nodes) {
    createdNodes.push(
      await prisma.questNode.create({
        data: {
          questId: quest.id,
          nodeIndex: node.nodeIndex,
          nodeType: node.nodeType,
          title: node.title,
          content: node.content,
          lat: node.lat,
          lng: node.lng,
          radius: node.radius,
          answer: 'answer' in node ? node.answer : undefined,
          reward: node.reward
        }
      })
    );
  }

  for (let index = 0; index < createdNodes.length - 1; index += 1) {
    await prisma.questNode.update({
      where: { id: createdNodes[index].id },
      data: { nextNode: createdNodes[index + 1].id }
    });
  }

  await prisma.userProgress.updateMany({
    where: { questId: quest.id, status: { not: 'finished' } },
    data: { currentNode: createdNodes[0].id, status: 'not_started', progress: {} }
  });

  return { quest, nodeCount: createdNodes.length };
}

async function seedAdmin() {
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: bcrypt.hashSync('ChangeMe123!', 10)
    }
  });
}

async function seedRolesAndEvents() {
  const roles = [
    ['investigator', '调查员', '适合主线推进，擅长还原档案线索。', 'story', '档案调查'],
    ['decoder', '破译师', '适合密码任务，擅长从城市细节里找到异常数字。', 'puzzle', '密码破译'],
    ['tracker', '追踪者', '适合限时追踪，擅长在城市动线里寻找目标。', 'route', '跨城追踪'],
    ['informant', '情报员', '适合真人/商家互动，擅长交换线索。', 'social', '线索交换']
  ] as const;

  for (const [code, name, description, focus, shareTag] of roles) {
    await prisma.playerRole.upsert({
      where: { code },
      update: { name, description, ability: { focus, shareTag }, status: 'active' },
      create: { code, name, description, ability: { focus, shareTag }, status: 'active' }
    });
  }

  const eventStartsAt = new Date(Date.now() - 60 * 60 * 1000);
  const eventEndsAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const cityEvent = await prisma.cityEvent.upsert({
    where: { id: 1n },
    update: {
      city: '重庆',
      title: '洪崖洞异常信号事件',
      eventType: 'daily',
      rarity: 'limited',
      summary: '雾都会信号在洪崖洞附近短暂出现。只有今天开放，领取后系统会随机分配一条不同的调查任务。',
      status: 'online',
      startsAt: eventStartsAt,
      endsAt: eventEndsAt,
      reward: {
        badge: '异常信号捕获者',
        shareTitle: '今天重庆又发生了一件异常事件',
        treasure: '神秘信封线索'
      }
    },
    create: {
      id: 1n,
      city: '重庆',
      title: '洪崖洞异常信号事件',
      eventType: 'daily',
      rarity: 'limited',
      summary: '雾都会信号在洪崖洞附近短暂出现。只有今天开放，领取后系统会随机分配一条不同的调查任务。',
      status: 'online',
      startsAt: eventStartsAt,
      endsAt: eventEndsAt,
      reward: {
        badge: '异常信号捕获者',
        shareTitle: '今天重庆又发生了一件异常事件',
        treasure: '神秘信封线索'
      }
    }
  });

  await prisma.userEventAssignment.deleteMany({ where: { eventId: cityEvent.id } });
  await prisma.eventTask.deleteMany({ where: { eventId: cityEvent.id } });
  await prisma.eventTask.createMany({
    data: [
      {
        eventId: cityEvent.id,
        title: '信号源确认',
        taskType: 'photo',
        content: '前往洪崖洞附近，拍摄一张能同时出现吊脚楼灯光与江面反光的照片，系统将生成“异常信号捕获”分享卡。',
        locationName: '洪崖洞观景点',
        lat: 29.56263,
        lng: 106.58605,
        radius: 100,
        reward: { shareTitle: '我在洪崖洞捕获了异常信号', clue: '信号频段：713' },
        weight: 2
      },
      {
        eventId: cityEvent.id,
        title: '线人留言',
        taskType: 'qa',
        content: '系统提示附近存在一名“线人”。MVP 阶段先以题目模拟：输入雾都会档案编号即可解锁线索。',
        locationName: '洪崖洞周边商圈',
        answer: 'SC1938',
        reward: { shareTitle: '我找到了雾都会线人留言', clue: '档案编号指向十八梯' },
        weight: 2
      },
      {
        eventId: cityEvent.id,
        title: 'NPC 暗号闯关',
        taskType: 'clue',
        content: '未来玩家需要向合作商家线人说出暗号并完成 60 秒观察挑战。MVP 阶段点击完成，验证真人互动任务入口。',
        locationName: '合作商家线索点',
        reward: { shareTitle: '我通过了雾都会线人试炼', clue: '线人给出了最后的信封' },
        weight: 1
      }
    ]
  });

  await prisma.clueDrop.upsert({
    where: { id: 1n },
    update: {
      city: '重庆',
      title: '十八梯秘密门牌',
      locationName: '十八梯传统风貌区',
      partnerName: '未来合作商家',
      clueType: 'envelope',
      status: 'planned',
      payload: { clue: 'SC-1938', usage: 'future-merchant-envelope' }
    },
    create: {
      id: 1n,
      city: '重庆',
      title: '十八梯秘密门牌',
      locationName: '十八梯传统风貌区',
      partnerName: '未来合作商家',
      clueType: 'envelope',
      status: 'planned',
      payload: { clue: 'SC-1938', usage: 'future-merchant-envelope' }
    }
  });
}

async function seedMceTemplates() {
  const templates = [
    {
      templateType: 'story',
      code: 'story_missing_case',
      name: '失踪案件',
      audience: '悬疑玩家 / 城市探秘用户',
      description: '以失踪档案、失踪线人、失踪商人为行动动机，适合城市悬疑主线。',
      config: {
        examples: ['失踪的档案', '失踪的邮差', '失踪的商人'],
        storyWeight: 20,
        openingFormat: '20秒语音 + 一句行动指令'
      }
    },
    {
      templateType: 'story',
      code: 'story_treasure_hunt',
      name: '寻宝任务',
      audience: '组队玩家 / 亲友游客',
      description: '以隐藏钥匙、城市宝藏和密码地图为核心，强调收集和最终解锁。',
      config: {
        examples: ['山城宝藏', '洪崖密码', '隐藏钥匙'],
        suitableChallenges: ['collect', 'password', 'photo']
      }
    },
    {
      templateType: 'challenge',
      code: 'challenge_limited_time',
      name: '限时挑战',
      audience: '喜欢紧张感和排名的玩家',
      description: '要求玩家在限定时间内完成任务，可接入倒计时、失败降级和排行榜。',
      config: {
        defaultMinutes: 20,
        failureMode: '降级完成',
        scoreWeight: 30,
        shareHook: '我在限定时间内完成了城市行动'
      }
    },
    {
      templateType: 'challenge',
      code: 'challenge_password',
      name: '密码挑战',
      audience: '解谜玩家',
      description: '通过观察、收集、组合数字或文字线索完成密码破解。',
      config: {
        verifyMode: 'qa',
        hintPolicy: '可配置一次提示',
        scoreWeight: 30
      }
    },
    {
      templateType: 'interaction',
      code: 'interaction_secret_contact',
      name: '暗号接头',
      audience: '真人互动任务',
      description: '玩家向 NPC 或商家线人说出暗号，对方回应暗号并给出线索。',
      config: {
        npcRole: '线人',
        verifyModes: ['staff_code', 'npc_qr', 'mock_pass'],
        requiredFields: ['secretCode', 'staffCode', 'commissionAmount'],
        scoreWeight: 30
      }
    },
    {
      templateType: 'interaction',
      code: 'interaction_clue_exchange',
      name: '玩家交换情报',
      audience: '多人任务 / 社交玩法',
      description: '不同玩家获得不同线索，必须交换或合作才能完成。',
      config: {
        minPlayers: 2,
        assignmentMode: 'random_split',
        futureMode: 'team_or_faction'
      }
    },
    {
      templateType: 'reward',
      code: 'reward_investigator_badge',
      name: '调查员徽章',
      audience: '主线通关用户',
      description: '完成城市行动后生成编号身份、证书和可分享成就卡。',
      config: {
        rarity: 'normal',
        shareTitle: '我成为了城市调查员',
        scoreWeight: 20
      }
    },
    {
      templateType: 'reward',
      code: 'reward_limited_title',
      name: '限定称号',
      audience: '早期玩家 / 排名玩家',
      description: '前 N 名、限时活动或唯一任务完成者获得限定称号。',
      config: {
        rarity: 'limited',
        grantRules: ['top_10', 'first_100', 'unique_daily']
      }
    },
    {
      templateType: 'route',
      code: 'route_city_5_points',
      name: '5 点城市探索路线',
      audience: '标准付费路线',
      description: '适合 2-3 小时标准体验，包含起点、转折、高潮和终点。',
      config: {
        points: 5,
        durationMinutes: 150,
        recommendedMix: {
          cityExploration: 20,
          challengeMechanism: 30,
          realHumanInteraction: 30,
          storyImmersion: 20
        }
      }
    },
    {
      templateType: 'route',
      code: 'route_family_3_points',
      name: '3 点亲子轻路线',
      audience: '亲子家庭 / 研学',
      description: '低强度短路线，包含观察点、知识点和小游戏点。',
      config: {
        points: 3,
        durationMinutes: 90,
        requiredFacilities: ['rest_area', 'toilet', 'low_walk_intensity']
      }
    }
  ];

  for (const template of templates) {
    await prisma.mceTemplate.upsert({
      where: { code: template.code },
      update: {
        templateType: template.templateType,
        name: template.name,
        audience: template.audience,
        description: template.description,
        config: template.config,
        status: 'active'
      },
      create: {
        ...template,
        status: 'active'
      }
    });
  }
}

async function seedMceCreatorProjects() {
  const templates = await prisma.mceTemplate.findMany({
    where: {
      code: {
        in: [
          'route_city_5_points',
          'story_missing_case',
          'challenge_limited_time',
          'challenge_password',
          'interaction_secret_contact',
          'interaction_clue_exchange',
          'reward_investigator_badge'
        ]
      }
    }
  });
  const byCode = new Map(templates.map((template) => [template.code, template.id]));

  await prisma.mceCreatorProject.deleteMany({
    where: { title: 'MCE Demo Draft: Fog City Contact Trial' }
  });

  await prisma.mceCreatorProject.create({
    data: {
      city: 'Chongqing',
      title: 'MCE Demo Draft: Fog City Contact Trial',
      targetAudience: 'Young travelers / mystery players',
      routeTemplateId: byCode.get('route_city_5_points') || null,
      storyTemplateId: byCode.get('story_missing_case') || null,
      challengeTemplateIds: [
        Number(byCode.get('challenge_limited_time')),
        Number(byCode.get('challenge_password'))
      ].filter(Boolean),
      interactionTemplateIds: [
        Number(byCode.get('interaction_secret_contact')),
        Number(byCode.get('interaction_clue_exchange'))
      ].filter(Boolean),
      rewardTemplateIds: [Number(byCode.get('reward_investigator_badge'))].filter(Boolean),
      experienceRatio: {
        cityExploration: 20,
        challengeMechanism: 30,
        realHumanInteraction: 30,
        storyImmersion: 20
      },
      status: 'draft'
    }
  });
}

async function main() {
  const { quest, nodeCount } = await seedQuest();
  await seedAdmin();
  await seedRolesAndEvents();
  await seedMceTemplates();
  await seedMceCreatorProjects();
  console.log(`Seeded quest ${quest.title} with ${nodeCount} nodes, including NPC challenge`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
