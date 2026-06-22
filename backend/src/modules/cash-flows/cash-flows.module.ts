import { Module } from '@nestjs/common';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { CashFlowsController } from './cash-flows.controller';
import { CashFlowsService } from './cash-flows.service';

@Module({
  imports: [PortfoliosModule],
  controllers: [CashFlowsController],
  providers: [CashFlowsService],
  exports: [CashFlowsService],
})
export class CashFlowsModule {}
