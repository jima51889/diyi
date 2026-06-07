import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminLoginDto,
  CreateMceProjectDto,
  CreateMceTemplateDto,
  CreateNodeDto,
  CreateQuestDto,
  ReviewQuestDto,
  UpdateMceProjectDto,
  UpdateMceTemplateDto,
  UpdateNodeDto,
  UpdateQuestDto
} from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { username: dto.username } });
    if (!admin || !bcrypt.compareSync(dto.password, admin.passwordHash)) {
      throw new UnauthorizedException('Invalid admin username or password');
    }
    return {
      token: this.jwt.sign({ sub: admin.id.toString(), username: admin.username }),
      admin: { id: Number(admin.id), username: admin.username }
    };
  }

  async quests() {
    const quests = await this.prisma.quest.findMany({
      include: { nodes: { orderBy: { nodeIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return quests.map((quest) => ({
      ...this.serializeQuest(quest),
      nodes: quest.nodes.map((node) => this.serializeNode(node))
    }));
  }

  async createQuest(dto: CreateQuestDto) {
    const quest = await this.prisma.quest.create({ data: dto });
    await this.logQuestAction(quest.id, 'create', null, quest.status, null);
    return this.serializeQuest(quest);
  }

  async updateQuest(id: bigint, dto: UpdateQuestDto) {
    const before = await this.prisma.quest.findUniqueOrThrow({ where: { id } });
    if (dto.status === 'online' && !['approved', 'offline', 'online'].includes(before.status)) {
      throw new BadRequestException('Quest must be approved before publishing');
    }
    const quest = await this.prisma.quest.update({ where: { id }, data: dto });
    if (dto.status && dto.status !== before.status) {
      await this.logQuestAction(id, 'status_update', before.status, dto.status, null);
    }
    return this.serializeQuest(quest);
  }

  async submitReview(id: bigint) {
    const quest = await this.prisma.quest.findUniqueOrThrow({ where: { id } });
    if (!['draft', 'rejected', 'offline'].includes(quest.status)) {
      throw new BadRequestException('Only draft, rejected, or offline quests can be submitted for review');
    }
    const updated = await this.prisma.quest.update({
      where: { id },
      data: { status: 'pending_review', submittedAt: new Date(), rejectReason: null }
    });
    await this.logQuestAction(id, 'submit_review', quest.status, 'pending_review', null);
    return this.serializeQuest(updated);
  }

  async approveQuest(id: bigint, dto: ReviewQuestDto) {
    const quest = await this.prisma.quest.findUniqueOrThrow({ where: { id } });
    if (quest.status !== 'pending_review') {
      throw new BadRequestException('Only pending review quests can be approved');
    }
    const updated = await this.prisma.quest.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), rejectReason: null }
    });
    await this.logQuestAction(id, 'approve', quest.status, 'approved', dto.reason || null);
    return this.serializeQuest(updated);
  }

  async rejectQuest(id: bigint, dto: ReviewQuestDto) {
    const quest = await this.prisma.quest.findUniqueOrThrow({ where: { id } });
    if (quest.status !== 'pending_review') {
      throw new BadRequestException('Only pending review quests can be rejected');
    }
    const reason = dto.reason || 'Rejected by platform review';
    const updated = await this.prisma.quest.update({
      where: { id },
      data: { status: 'rejected', rejectReason: reason }
    });
    await this.logQuestAction(id, 'reject', quest.status, 'rejected', reason);
    return this.serializeQuest(updated);
  }

  async suspendQuest(id: bigint, dto: ReviewQuestDto) {
    const quest = await this.prisma.quest.findUniqueOrThrow({ where: { id } });
    const reason = dto.reason || 'Suspended by platform';
    const updated = await this.prisma.quest.update({
      where: { id },
      data: { status: 'suspended', rejectReason: reason }
    });
    await this.logQuestAction(id, 'suspend', quest.status, 'suspended', reason);
    return this.serializeQuest(updated);
  }

  async deleteQuest(id: bigint) {
    await this.prisma.questNode.deleteMany({ where: { questId: id } });
    await this.prisma.questAuditLog.deleteMany({ where: { questId: id } });
    await this.prisma.quest.delete({ where: { id } });
    return { success: true };
  }

  async createNode(questId: bigint, dto: CreateNodeDto) {
    const node = await this.prisma.questNode.create({
      data: this.toNodeCreateData(questId, dto)
    });
    return this.serializeNode(node);
  }

  async updateNode(id: bigint, dto: UpdateNodeDto) {
    const data: Prisma.QuestNodeUncheckedUpdateInput = {
      ...dto,
      reward: dto.reward as Prisma.InputJsonValue | undefined,
      nextNode: Object.prototype.hasOwnProperty.call(dto, 'nextNode')
        ? dto.nextNode ? BigInt(dto.nextNode) : null
        : undefined
    };
    const node = await this.prisma.questNode.update({ where: { id }, data });
    return this.serializeNode(node);
  }

  async deleteNode(id: bigint) {
    await this.prisma.questNode.delete({ where: { id } });
    return { success: true };
  }

  async mceTemplates() {
    const templates = await this.prisma.mceTemplate.findMany({
      orderBy: [{ templateType: 'asc' }, { createdAt: 'desc' }]
    });
    return templates.map((template) => this.serializeMceTemplate(template));
  }

  async createMceTemplate(dto: CreateMceTemplateDto) {
    const template = await this.prisma.mceTemplate.create({
      data: {
        templateType: dto.templateType,
        code: dto.code,
        name: dto.name,
        audience: dto.audience,
        description: dto.description,
        config: dto.config as Prisma.InputJsonValue | undefined,
        status: dto.status || 'active'
      }
    });
    return this.serializeMceTemplate(template);
  }

  async updateMceTemplate(id: bigint, dto: UpdateMceTemplateDto) {
    const template = await this.prisma.mceTemplate.update({
      where: { id },
      data: {
        templateType: dto.templateType,
        code: dto.code,
        name: dto.name,
        audience: dto.audience,
        description: dto.description,
        config: dto.config as Prisma.InputJsonValue | undefined,
        status: dto.status
      }
    });
    return this.serializeMceTemplate(template);
  }

  async deleteMceTemplate(id: bigint) {
    await this.prisma.mceTemplate.delete({ where: { id } });
    return { success: true };
  }

  async mceProjects() {
    const projects = await this.prisma.mceCreatorProject.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return projects.map((project) => this.serializeMceProject(project));
  }

  async createMceProject(dto: CreateMceProjectDto) {
    const project = await this.prisma.mceCreatorProject.create({
      data: {
        city: dto.city,
        title: dto.title,
        targetAudience: dto.targetAudience,
        routeTemplateId: dto.routeTemplateId ? BigInt(dto.routeTemplateId) : null,
        storyTemplateId: dto.storyTemplateId ? BigInt(dto.storyTemplateId) : null,
        challengeTemplateIds: dto.challengeTemplateIds as Prisma.InputJsonValue | undefined,
        interactionTemplateIds: dto.interactionTemplateIds as Prisma.InputJsonValue | undefined,
        rewardTemplateIds: dto.rewardTemplateIds as Prisma.InputJsonValue | undefined,
        experienceRatio: dto.experienceRatio as Prisma.InputJsonValue | undefined,
        status: dto.status || 'draft'
      }
    });
    return this.serializeMceProject(project);
  }

  async updateMceProject(id: bigint, dto: UpdateMceProjectDto) {
    const project = await this.prisma.mceCreatorProject.update({
      where: { id },
      data: {
        city: dto.city,
        title: dto.title,
        targetAudience: dto.targetAudience,
        routeTemplateId: Object.prototype.hasOwnProperty.call(dto, 'routeTemplateId')
          ? dto.routeTemplateId ? BigInt(dto.routeTemplateId) : null
          : undefined,
        storyTemplateId: Object.prototype.hasOwnProperty.call(dto, 'storyTemplateId')
          ? dto.storyTemplateId ? BigInt(dto.storyTemplateId) : null
          : undefined,
        challengeTemplateIds: dto.challengeTemplateIds as Prisma.InputJsonValue | undefined,
        interactionTemplateIds: dto.interactionTemplateIds as Prisma.InputJsonValue | undefined,
        rewardTemplateIds: dto.rewardTemplateIds as Prisma.InputJsonValue | undefined,
        experienceRatio: dto.experienceRatio as Prisma.InputJsonValue | undefined,
        status: dto.status
      }
    });
    return this.serializeMceProject(project);
  }

  async deleteMceProject(id: bigint) {
    await this.prisma.mceCreatorProject.delete({ where: { id } });
    return { success: true };
  }

  async users() {
    const users = await this.prisma.user.findMany({
      include: { orders: true, progress: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return users.map((user) => ({
      id: Number(user.id),
      openid: user.openid,
      nickname: user.nickname,
      phone: user.phone,
      orders: user.orders.length,
      challenges: user.progress.length,
      createdAt: user.createdAt
    }));
  }

  async stats() {
    const [registeredUsers, orders, paidUsers, finishedRecords, onlineQuests] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.groupBy({ by: ['userId'], where: { status: 'paid' } }),
      this.prisma.finishRecord.count(),
      this.prisma.quest.count({ where: { status: 'online' } })
    ]);
    return {
      registeredUsers,
      orders,
      paidUsers: paidUsers.length,
      finishedRecords,
      onlineQuests,
      completionRate: orders > 0 ? finishedRecords / orders : 0
    };
  }

  private serializeNode(node: {
    id: bigint;
    questId: bigint;
    nodeIndex: number;
    nodeType: string;
    title: string;
    content: string | null;
    lat: unknown;
    lng: unknown;
    radius: number | null;
    answer: string | null;
    reward: unknown;
    nextNode: bigint | null;
  }) {
    return {
      ...node,
      id: Number(node.id),
      questId: Number(node.questId),
      lat: node.lat === null ? undefined : Number(node.lat),
      lng: node.lng === null ? undefined : Number(node.lng),
      nextNode: node.nextNode ? Number(node.nextNode) : undefined
    };
  }

  private toNodeCreateData(questId: bigint, dto: CreateNodeDto): Prisma.QuestNodeUncheckedCreateInput {
    return {
      questId,
      nodeIndex: dto.nodeIndex,
      nodeType: dto.nodeType,
      title: dto.title,
      content: dto.content,
      lat: dto.lat,
      lng: dto.lng,
      radius: dto.radius,
      answer: dto.answer,
      reward: dto.reward as Prisma.InputJsonValue | undefined,
      nextNode: dto.nextNode ? BigInt(dto.nextNode) : null
    };
  }

  private serializeQuest(quest: {
    id: bigint;
    creatorId?: bigint | null;
    commissionRuleId?: bigint | null;
    price: unknown;
    distance: unknown;
    [key: string]: unknown;
  }) {
    return {
      ...quest,
      id: Number(quest.id),
      creatorId: quest.creatorId ? Number(quest.creatorId) : null,
      commissionRuleId: quest.commissionRuleId ? Number(quest.commissionRuleId) : null,
      price: Number(quest.price),
      distance: Number(quest.distance)
    };
  }

  private serializeMceTemplate(template: {
    id: bigint;
    templateType: string;
    code: string;
    name: string;
    audience: string | null;
    description: string | null;
    config: unknown;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...template,
      id: Number(template.id)
    };
  }

  private serializeMceProject(project: {
    id: bigint;
    creatorId: bigint | null;
    questId: bigint | null;
    routeTemplateId: bigint | null;
    storyTemplateId: bigint | null;
    [key: string]: unknown;
  }) {
    return {
      ...project,
      id: Number(project.id),
      creatorId: project.creatorId ? Number(project.creatorId) : null,
      questId: project.questId ? Number(project.questId) : null,
      routeTemplateId: project.routeTemplateId ? Number(project.routeTemplateId) : null,
      storyTemplateId: project.storyTemplateId ? Number(project.storyTemplateId) : null
    };
  }

  private async logQuestAction(questId: bigint, action: string, fromStatus: string | null, toStatus: string | null, remark: string | null) {
    await this.prisma.questAuditLog.create({
      data: { questId, action, fromStatus, toStatus, remark }
    });
  }
}
