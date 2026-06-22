import { Module } from '@nestjs/common';
import { CashFlowsModule } from '../cash-flows/cash-flows.module';
import { HoldingsModule } from '../holdings/holdings.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [HoldingsModule, PortfoliosModule, CashFlowsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
