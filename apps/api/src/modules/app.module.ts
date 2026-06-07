import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { GameModule } from './game/game.module';
import { OrdersModule } from './orders/orders.module';
import { PayModule } from './pay/pay.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuestsModule } from './quests/quests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AdminModule,
    AuthModule,
    QuestsModule,
    OrdersModule,
    PayModule,
    GameModule,
    EventsModule
  ]
})
export class AppModule {}
