import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const quests = await this.prisma.quest.findMany({
      where: { status: 'online' },
      orderBy: { createdAt: 'desc' }
    });
    return quests.map((quest) => this.serializeQuest(quest));
  }

  async findOne(id: bigint) {
    const quest = await this.prisma.quest.findFirst({
      where: { id, status: 'online' },
      include: { nodes: { orderBy: { nodeIndex: 'asc' } } }
    });
    if (!quest) {
      throw new NotFoundException('路线不存在或未上架');
    }
    return {
      ...this.serializeQuest(quest),
      nodes: quest.nodes.map((node) => ({
        ...node,
        id: Number(node.id),
        questId: Number(node.questId),
        lat: node.lat ? Number(node.lat) : undefined,
        lng: node.lng ? Number(node.lng) : undefined,
        nextNode: node.nextNode ? Number(node.nextNode) : undefined
      }))
    };
  }

  private serializeQuest(quest: {
    id: bigint;
    creatorId: bigint | null;
    commissionRuleId: bigint | null;
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
}
