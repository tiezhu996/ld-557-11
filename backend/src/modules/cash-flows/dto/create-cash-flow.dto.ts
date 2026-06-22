import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CashFlowType } from '../../../constants/enums';

export class CreateCashFlowDto {
  @ApiProperty({ enum: [CashFlowType.DEPOSIT, CashFlowType.WITHDRAW] })
  @IsEnum([CashFlowType.DEPOSIT, CashFlowType.WITHDRAW])
  type: CashFlowType.DEPOSIT | CashFlowType.WITHDRAW;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '初始资金', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
