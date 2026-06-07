import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('today')
  today(@Query('city') city = '重庆') {
    return this.eventsService.today(city);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('assignment')
  assignment(@CurrentUser() user: JwtUser, @Query('city') city = '重庆') {
    return this.eventsService.currentAssignment(BigInt(user.sub), city);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/claim')
  claim(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.eventsService.claim(BigInt(user.sub), BigInt(id));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('tasks/:id/answer')
  answer(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body('answer') answer = '') {
    return this.eventsService.answer(BigInt(user.sub), BigInt(id), answer);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('tasks/:id/mock-pass')
  mockPass(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.eventsService.mockPass(BigInt(user.sub), BigInt(id));
  }
}
