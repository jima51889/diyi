import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class NodeActionDto {
  @IsInt()
  @Min(1)
  nodeId!: number;

  @IsOptional()
  @IsString()
  payload?: string;
}
