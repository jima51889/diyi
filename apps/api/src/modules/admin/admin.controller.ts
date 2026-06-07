import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
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
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Get('quests')
  @UseGuards(JwtAuthGuard)
  quests() {
    return this.adminService.quests();
  }

  @Post('quests')
  @UseGuards(JwtAuthGuard)
  createQuest(@Body() dto: CreateQuestDto) {
    return this.adminService.createQuest(dto);
  }

  @Patch('quests/:id')
  @UseGuards(JwtAuthGuard)
  updateQuest(@Param('id') id: string, @Body() dto: UpdateQuestDto) {
    return this.adminService.updateQuest(BigInt(id), dto);
  }

  @Post('quests/:id/submit-review')
  @UseGuards(JwtAuthGuard)
  submitReview(@Param('id') id: string) {
    return this.adminService.submitReview(BigInt(id));
  }

  @Post('quests/:id/approve')
  @UseGuards(JwtAuthGuard)
  approveQuest(@Param('id') id: string, @Body() dto: ReviewQuestDto) {
    return this.adminService.approveQuest(BigInt(id), dto);
  }

  @Post('quests/:id/reject')
  @UseGuards(JwtAuthGuard)
  rejectQuest(@Param('id') id: string, @Body() dto: ReviewQuestDto) {
    return this.adminService.rejectQuest(BigInt(id), dto);
  }

  @Post('quests/:id/suspend')
  @UseGuards(JwtAuthGuard)
  suspendQuest(@Param('id') id: string, @Body() dto: ReviewQuestDto) {
    return this.adminService.suspendQuest(BigInt(id), dto);
  }

  @Delete('quests/:id')
  @UseGuards(JwtAuthGuard)
  deleteQuest(@Param('id') id: string) {
    return this.adminService.deleteQuest(BigInt(id));
  }

  @Post('quests/:questId/nodes')
  @UseGuards(JwtAuthGuard)
  createNode(@Param('questId') questId: string, @Body() dto: CreateNodeDto) {
    return this.adminService.createNode(BigInt(questId), dto);
  }

  @Patch('nodes/:id')
  @UseGuards(JwtAuthGuard)
  updateNode(@Param('id') id: string, @Body() dto: UpdateNodeDto) {
    return this.adminService.updateNode(BigInt(id), dto);
  }

  @Delete('nodes/:id')
  @UseGuards(JwtAuthGuard)
  deleteNode(@Param('id') id: string) {
    return this.adminService.deleteNode(BigInt(id));
  }

  @Get('mce/templates')
  @UseGuards(JwtAuthGuard)
  mceTemplates() {
    return this.adminService.mceTemplates();
  }

  @Post('mce/templates')
  @UseGuards(JwtAuthGuard)
  createMceTemplate(@Body() dto: CreateMceTemplateDto) {
    return this.adminService.createMceTemplate(dto);
  }

  @Patch('mce/templates/:id')
  @UseGuards(JwtAuthGuard)
  updateMceTemplate(@Param('id') id: string, @Body() dto: UpdateMceTemplateDto) {
    return this.adminService.updateMceTemplate(BigInt(id), dto);
  }

  @Delete('mce/templates/:id')
  @UseGuards(JwtAuthGuard)
  deleteMceTemplate(@Param('id') id: string) {
    return this.adminService.deleteMceTemplate(BigInt(id));
  }

  @Get('mce/projects')
  @UseGuards(JwtAuthGuard)
  mceProjects() {
    return this.adminService.mceProjects();
  }

  @Post('mce/projects')
  @UseGuards(JwtAuthGuard)
  createMceProject(@Body() dto: CreateMceProjectDto) {
    return this.adminService.createMceProject(dto);
  }

  @Patch('mce/projects/:id')
  @UseGuards(JwtAuthGuard)
  updateMceProject(@Param('id') id: string, @Body() dto: UpdateMceProjectDto) {
    return this.adminService.updateMceProject(BigInt(id), dto);
  }

  @Delete('mce/projects/:id')
  @UseGuards(JwtAuthGuard)
  deleteMceProject(@Param('id') id: string) {
    return this.adminService.deleteMceProject(BigInt(id));
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  users() {
    return this.adminService.users();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  stats() {
    return this.adminService.stats();
  }
}
