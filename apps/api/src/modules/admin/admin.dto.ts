import { Allow, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export const questStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'online', 'offline', 'suspended'] as const;
export const mceTemplateTypes = ['story', 'challenge', 'interaction', 'reward', 'route'] as const;
export const mceTemplateStatuses = ['active', 'inactive'] as const;
export const mceProjectStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'online', 'offline'] as const;

export class AdminLoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}

export class CreateQuestDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  duration!: number;

  @IsNumber()
  @Min(0)
  distance!: number;

  @IsIn(['easy', 'normal', 'hard'])
  difficulty!: string;

  @IsIn(questStatuses)
  status!: string;
}

export class UpdateQuestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsIn(['easy', 'normal', 'hard'])
  difficulty?: string;

  @IsOptional()
  @IsIn(questStatuses)
  status?: string;
}

export class ReviewQuestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateNodeDto {
  @IsInt()
  @Min(1)
  nodeIndex!: number;

  @IsIn(['gps', 'qa', 'photo', 'qr', 'challenge'])
  nodeType!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  radius?: number;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  nextNode?: number;

  @IsOptional()
  @Allow()
  reward?: Record<string, unknown>;
}

export class UpdateNodeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  nodeIndex?: number;

  @IsOptional()
  @IsIn(['gps', 'qa', 'photo', 'qr', 'challenge'])
  nodeType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  radius?: number;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  nextNode?: number;

  @IsOptional()
  @Allow()
  reward?: Record<string, unknown>;
}

export class CreateMceTemplateDto {
  @IsIn(mceTemplateTypes)
  templateType!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Allow()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsIn(mceTemplateStatuses)
  status?: string;
}

export class UpdateMceTemplateDto {
  @IsOptional()
  @IsIn(mceTemplateTypes)
  templateType?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Allow()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsIn(mceTemplateStatuses)
  status?: string;
}

export class CreateMceProjectDto {
  @IsString()
  city!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  routeTemplateId?: number;

  @IsOptional()
  @IsNumber()
  storyTemplateId?: number;

  @IsOptional()
  @Allow()
  challengeTemplateIds?: number[];

  @IsOptional()
  @Allow()
  interactionTemplateIds?: number[];

  @IsOptional()
  @Allow()
  rewardTemplateIds?: number[];

  @IsOptional()
  @Allow()
  experienceRatio?: Record<string, unknown>;

  @IsOptional()
  @IsIn(mceProjectStatuses)
  status?: string;
}

export class UpdateMceProjectDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  routeTemplateId?: number | null;

  @IsOptional()
  @IsNumber()
  storyTemplateId?: number | null;

  @IsOptional()
  @Allow()
  challengeTemplateIds?: number[];

  @IsOptional()
  @Allow()
  interactionTemplateIds?: number[];

  @IsOptional()
  @Allow()
  rewardTemplateIds?: number[];

  @IsOptional()
  @Allow()
  experienceRatio?: Record<string, unknown>;

  @IsOptional()
  @IsIn(mceProjectStatuses)
  status?: string;
}
