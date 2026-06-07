import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, questId: bigint) {
    const quest = await this.prisma.quest.findFirst({
      where: { id: questId, status: 'online' }
    });
    if (!quest) {
      throw new NotFoundException('Quest not found or not online');
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        questId,
        amount: quest.price,
        status: 'pending'
      }
    });

    return {
      orderId: Number(order.id),
      amount: Number(order.amount),
      status: order.status,
      payParams: {
        timeStamp: '',
        nonceStr: '',
        package: '',
        signType: 'RSA',
        paySign: ''
      }
    };
  }

  async mockPay(userId: bigint, orderId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quest: {
          include: {
            nodes: { orderBy: { nodeIndex: 'asc' } }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Order does not belong to current user');
    }

    const firstNode = order.quest.nodes[0];
    const paidOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        payTime: new Date()
      }
    });

    await this.prisma.userProgress.upsert({
      where: { userId_questId: { userId, questId: order.questId } },
      update: {
        currentNode: firstNode?.id ?? null,
        status: firstNode ? 'purchased' : 'finished',
        progress: { mockPaidOrderId: Number(orderId), paidAt: new Date().toISOString() }
      },
      create: {
        userId,
        questId: order.questId,
        currentNode: firstNode?.id ?? null,
        status: firstNode ? 'purchased' : 'finished',
        progress: { mockPaidOrderId: Number(orderId), paidAt: new Date().toISOString() }
      }
    });

    return {
      success: true,
      orderId: Number(paidOrder.id),
      status: paidOrder.status,
      questId: Number(order.questId),
      currentNode: firstNode ? Number(firstNode.id) : null
    };
  }
}
