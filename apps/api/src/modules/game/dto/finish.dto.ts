import { IsInt, Min } from 'class-validator';

export class FinishDto {
  @IsInt()
  @Min(1)
  questId!: number;

  @IsInt()
  @Min(0)
  duration!: number;
}
