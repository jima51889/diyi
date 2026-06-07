import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerDto } from './dto/answer.dto';
import { CheckinDto } from './dto/checkin.dto';
import { FinishDto } from './dto/finish.dto';
import { NodeActionDto } from './dto/node-action.dto';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: bigint, questId: bigint) {
    const progress = await this.prisma.userProgress.upsert({
      where: { userId_questId: { userId, questId } },
      update: {},
      create: { userId, questId, status: 'not_started', progress: {} }
    });
    return this.serializeProgress(progress);
  }

  async start(userId: bigint, questId: bigint) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      include: { nodes: { orderBy: { nodeIndex: 'asc' } } }
    });
    if (!quest) {
      throw new NotFoundException('Quest not found');
    }

    const paidOrder = await this.prisma.order.findFirst({
      where: { userId, questId, status: 'paid' },
      orderBy: { payTime: 'desc' }
    });
    if (!paidOrder) {
      throw new BadRequestException('Quest is not purchased');
    }

    const firstNode = quest.nodes[0];
    const progress = await this.prisma.userProgress.upsert({
      where: { userId_questId: { userId, questId } },
      update: {
        currentNode: firstNode?.id ?? null,
        status: firstNode ? 'in_progress' : 'finished',
        progress: { startedAt: new Date().toISOString(), paidOrderId: Number(paidOrder.id) }
      },
      create: {
        userId,
        questId,
        currentNode: firstNode?.id ?? null,
        status: firstNode ? 'in_progress' : 'finished',
        progress: { startedAt: new Date().toISOString(), paidOrderId: Number(paidOrder.id) }
      }
    });

    return this.serializeProgress(progress);
  }

  async checkin(userId: bigint, dto: CheckinDto) {
    const node = await this.findNode(BigInt(dto.nodeId), 'gps');
    const distance = this.distanceInMeters(dto.lat, dto.lng, Number(node.lat), Number(node.lng));
    const radius = node.radius || 80;
    if (distance > radius) {
      return { success: false, distance: Math.round(distance), radius };
    }

    const nextNode = await this.passNode(userId, BigInt(dto.questId), node.id);
    return { success: true, nextNode };
  }

  async answer(userId: bigint, dto: AnswerDto) {
    const node = await this.findNode(BigInt(dto.nodeId), 'qa');
    const pass = node.answer?.trim().toLowerCase() === dto.answer.trim().toLowerCase();
    if (!pass) {
      return { pass: false };
    }

    const nextNode = await this.passNode(userId, node.questId, node.id);
    return { pass: true, nextNode };
  }

  async mockPass(userId: bigint, dto: NodeActionDto, expectedType: 'photo' | 'qr' | 'challenge') {
    const node = await this.findNode(BigInt(dto.nodeId), expectedType);
    const nextNode = await this.passNode(userId, node.questId, node.id);
    return { pass: true, nextNode };
  }

  async finish(userId: bigint, dto: FinishDto) {
    const questId = BigInt(dto.questId);
    const record = await this.prisma.finishRecord.create({
      data: {
        userId,
        questId,
        finishTime: new Date(),
        duration: dto.duration,
        certificateUrl: `mock://certificates/${userId}-${dto.questId}-${Date.now()}.pdf`
      }
    });

    await this.prisma.userProgress.upsert({
      where: { userId_questId: { userId, questId } },
      update: { currentNode: null, status: 'finished' },
      create: { userId, questId, currentNode: null, status: 'finished', progress: {} }
    });

    return { recordId: Number(record.id), certificateUrl: record.certificateUrl };
  }

  async finishRecords(userId: bigint) {
    const records = await this.prisma.finishRecord.findMany({
      where: { userId },
      include: { quest: { select: { id: true, title: true, cover: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return records.map((record) => ({
      id: Number(record.id),
      questId: Number(record.questId),
      questTitle: record.quest.title,
      questCover: record.quest.cover,
      finishTime: record.finishTime,
      duration: record.duration,
      certificateUrl: record.certificateUrl,
      createdAt: record.createdAt
    }));
  }

  private async findNode(nodeId: bigint, expectedType: string) {
    const node = await this.prisma.questNode.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Quest node not found');
    }
    if (node.nodeType !== expectedType) {
      throw new BadRequestException('Quest node type mismatch');
    }
    return node;
  }

  private async passNode(userId: bigint, questId: bigint, nodeId: bigint) {
    const node = await this.prisma.questNode.findUniqueOrThrow({ where: { id: nodeId } });
    await this.prisma.userProgress.upsert({
      where: { userId_questId: { userId, questId } },
      update: {
        currentNode: node.nextNode,
        status: node.nextNode ? 'in_progress' : 'finished',
        progress: { passedNode: Number(nodeId) }
      },
      create: {
        userId,
        questId,
        currentNode: node.nextNode,
        status: node.nextNode ? 'in_progress' : 'finished',
        progress: { passedNode: Number(nodeId) }
      }
    });
    return node.nextNode ? Number(node.nextNode) : null;
  }

  private distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const earthRadius = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(value: number) {
    return (value * Math.PI) / 180;
  }

  private serializeProgress(progress: {
    id: bigint;
    userId: bigint;
    questId: bigint;
    currentNode: bigint | null;
    progress: unknown;
    status: string;
  }) {
    return {
      id: Number(progress.id),
      userId: Number(progress.userId),
      questId: Number(progress.questId),
      currentNode: progress.currentNode ? Number(progress.currentNode) : null,
      progress: progress.progress,
      status: progress.status
    };
  }
}
