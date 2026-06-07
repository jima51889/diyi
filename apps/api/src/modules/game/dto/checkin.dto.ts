import { IsInt, IsNumber, Min } from 'class-validator';

export class CheckinDto {
  @IsInt()
  @Min(1)
  questId!: number;

  @IsInt()
  @Min(1)
  nodeId!: number;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}
