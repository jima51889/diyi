import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async today(city: string) {
    const now = new Date();
    const events = await this.prisma.cityEvent.findMany({
      where: {
        city,
        status: 'online',
        startsAt: { lte: now },
        endsAt: { gt: now }
      },
      include: { tasks: true },
      orderBy: [{ rarity: 'desc' }, { endsAt: 'asc' }]
    });

    return events.map((event) => this.serializeEvent(event));
  }

  async currentAssignment(userId: bigint, city: string) {
    const now = new Date();
    const assignment = await this.prisma.userEventAssignment.findFirst({
      where: {
        userId,
        event: {
          city,
          status: 'online',
          startsAt: { lte: now },
          endsAt: { gt: now }
        }
      },
      include: {
        event: { include: { tasks: true } },
        task: true,
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return assignment ? this.serializeAssignment(assignment) : null;
  }

  async claim(userId: bigint, eventId: bigint) {
    const event = await this.prisma.cityEvent.findUnique({
      where: { id: eventId },
      include: { tasks: true }
    });
    if (!event || event.status !== 'online') {
      throw new NotFoundException('City event not found');
    }
    const now = new Date();
    if (event.startsAt > now || event.endsAt <= now) {
      throw new BadRequestException('City event is not active');
    }
    if (!event.tasks.length) {
      throw new BadRequestException('City event has no tasks');
    }

    const existing = await this.prisma.userEventAssignment.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { event: { include: { tasks: true } }, task: true, role: true }
    });
    if (existing) {
      return this.serializeAssignment(existing);
    }

    const task = this.pickWeighted(event.tasks);
    const role = await this.pickRole();
    const assignment = await this.prisma.userEventAssignment.create({
      data: {
        userId,
        eventId,
        taskId: task.id,
        roleId: role?.id,
        status: 'claimed',
        progress: {
          source: 'h5-mvp',
          clueState: 'waiting',
          assignedAt: now.toISOString()
        }
      },
      include: {
        event: { include: { tasks: true } },
        task: true,
        role: true
      }
    });

    return this.serializeAssignment(assignment);
  }

  async answer(userId: bigint, taskId: bigint, answer: string) {
    const assignment = await this.findClaimedAssignment(userId, taskId);
    if (assignment.task.taskType !== 'qa') {
      throw new BadRequestException('Event task type mismatch');
    }
    const pass = assignment.task.answer?.trim().toLowerCase() === answer.trim().toLowerCase();
    if (!pass) {
      return { pass: false };
    }
    const completed = await this.completeAssignment(assignment.id);
    return { pass: true, assignment: completed };
  }

  async mockPass(userId: bigint, taskId: bigint) {
    const assignment = await this.findClaimedAssignment(userId, taskId);
    const completed = await this.completeAssignment(assignment.id);
    return { pass: true, assignment: completed };
  }

  private async findClaimedAssignment(userId: bigint, taskId: bigint) {
    const assignment = await this.prisma.userEventAssignment.findFirst({
      where: { userId, taskId },
      include: { event: { include: { tasks: true } }, task: true, role: true }
    });
    if (!assignment) {
      throw new NotFoundException('Event assignment not found');
    }
    if (assignment.status === 'completed') {
      return assignment;
    }
    return assignment;
  }

  private async completeAssignment(id: bigint) {
    const assignment = await this.prisma.userEventAssignment.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        sharePayload: {
          title: '今天重庆又发生了一件异常事件',
          subtitle: '我已完成今日城市事件调查',
          template: 'event-complete-v1'
        }
      },
      include: { event: { include: { tasks: true } }, task: true, role: true }
    });
    return this.serializeAssignment(assignment);
  }

  private async pickRole() {
    const roles = await this.prisma.playerRole.findMany({ where: { status: 'active' }, orderBy: { id: 'asc' } });
    if (!roles.length) return null;
    const index = Math.floor(Math.random() * roles.length);
    return roles[index];
  }

  private pickWeighted<T extends { weight: number }>(items: T[]) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * total;
    for (const item of items) {
      cursor -= item.weight;
      if (cursor <= 0) return item;
    }
    return items[0];
  }

  private serializeEvent(event: any) {
    const now = Date.now();
    return {
      id: Number(event.id),
      city: event.city,
      title: event.title,
      eventType: event.eventType,
      rarity: event.rarity,
      summary: event.summary,
      cover: event.cover,
      reward: event.reward,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      remainingSeconds: Math.max(0, Math.floor((event.endsAt.getTime() - now) / 1000)),
      taskCount: event.tasks?.length || 0
    };
  }

  private serializeAssignment(assignment: any) {
    return {
      id: Number(assignment.id),
      status: assignment.status,
      progress: assignment.progress,
      sharePayload: assignment.sharePayload,
      completedAt: assignment.completedAt,
      event: this.serializeEvent(assignment.event),
      task: {
        id: Number(assignment.task.id),
        title: assignment.task.title,
        taskType: assignment.task.taskType,
        content: assignment.task.content,
        locationName: assignment.task.locationName,
        lat: assignment.task.lat ? Number(assignment.task.lat) : null,
        lng: assignment.task.lng ? Number(assignment.task.lng) : null,
        radius: assignment.task.radius,
        payload: assignment.task.payload,
        reward: assignment.task.reward
      },
      role: assignment.role
        ? {
            id: Number(assignment.role.id),
            code: assignment.role.code,
            name: assignment.role.name,
            description: assignment.role.description,
            ability: assignment.role.ability
          }
        : null
    };
  }
}
