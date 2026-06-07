import { IsInt, IsString, Min } from 'class-validator';

export class AnswerDto {
  @IsInt()
  @Min(1)
  nodeId!: number;

  @IsString()
  answer!: string;
}
