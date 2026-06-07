import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AnswerDto } from './dto/answer.dto';
import { CheckinDto } from './dto/checkin.dto';
import { FinishDto } from './dto/finish.dto';
import { NodeActionDto } from './dto/node-action.dto';
import { GameService } from './game.service';

@ApiTags('game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('progress')
  progress(@CurrentUser() user: JwtUser, @Query('questId') questId: string) {
    return this.gameService.getProgress(BigInt(user.sub), BigInt(questId));
  }

  @Post('start')
  start(@CurrentUser() user: JwtUser, @Body('questId') questId: number) {
    return this.gameService.start(BigInt(user.sub), BigInt(questId));
  }

  @Post('checkin')
  checkin(@CurrentUser() user: JwtUser, @Body() dto: CheckinDto) {
    return this.gameService.checkin(BigInt(user.sub), dto);
  }

  @Post('answer')
  answer(@CurrentUser() user: JwtUser, @Body() dto: AnswerDto) {
    return this.gameService.answer(BigInt(user.sub), dto);
  }

  @Post('photo')
  photo(@CurrentUser() user: JwtUser, @Body() dto: NodeActionDto) {
    return this.gameService.mockPass(BigInt(user.sub), dto, 'photo');
  }

  @Post('qr')
  qr(@CurrentUser() user: JwtUser, @Body() dto: NodeActionDto) {
    return this.gameService.mockPass(BigInt(user.sub), dto, 'qr');
  }

  @Post('challenge')
  challenge(@CurrentUser() user: JwtUser, @Body() dto: NodeActionDto) {
    return this.gameService.mockPass(BigInt(user.sub), dto, 'challenge');
  }

  @Post('finish')
  finish(@CurrentUser() user: JwtUser, @Body() dto: FinishDto) {
    return this.gameService.finish(BigInt(user.sub), dto);
  }

  @Get('finish-records')
  finishRecords(@CurrentUser() user: JwtUser) {
    return this.gameService.finishRecords(BigInt(user.sub));
  }
}
