import { BadRequestException, Injectable } from '@nestjs/common';
import { CashFlowType } from '../../constants/enums';
import { CurrentUser } from '../../types/request';
import { paginate } from '../../utils/pagination';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';

export interface CashFlowRecord {
  id: number;
  portfolioId: number;
  type: CashFlowType;
  amount: number;
  balanceAfter: number;
  remark: string;
  createdAt: string;
}

@Injectable()
export class CashFlowsService {
  private readonly cashFlows: CashFlowRecord[] = [];
  private nextId = 1;

  constructor(private readonly portfoliosService: PortfoliosService) {}

  listByPortfolio(portfolioId: number, user: CurrentUser, page = 1, pageSize = 20) {
    this.portfoliosService.findOwned(portfolioId, user);
    return paginate(
      this.cashFlows.filter((item) => item.portfolioId === portfolioId).sort((a, b) => b.id - a.id),
      page,
      pageSize,
    );
  }

  deposit(portfolioId: number, dto: CreateCashFlowDto, user: CurrentUser) {
    this.portfoliosService.findOwned(portfolioId, user);
    const balanceAfter = this.portfoliosService.addCash(portfolioId, dto.amount);
    const record: CashFlowRecord = {
      id: this.nextId++,
      portfolioId,
      type: CashFlowType.DEPOSIT,
      amount: Number(dto.amount.toFixed(2)),
      balanceAfter: Number(balanceAfter.toFixed(2)),
      remark: dto.remark ?? '',
      createdAt: new Date().toISOString(),
    };
    this.cashFlows.push(record);
    return record;
  }

  withdraw(portfolioId: number, dto: CreateCashFlowDto, user: CurrentUser) {
    this.portfoliosService.findOwned(portfolioId, user);
    const currentCash = this.portfoliosService.getCashBalance(portfolioId);
    if (currentCash < dto.amount) {
      throw new BadRequestException('insufficient cash balance');
    }
    const balanceAfter = this.portfoliosService.addCash(portfolioId, -dto.amount);
    const record: CashFlowRecord = {
      id: this.nextId++,
      portfolioId,
      type: CashFlowType.WITHDRAW,
      amount: Number(dto.amount.toFixed(2)),
      balanceAfter: Number(balanceAfter.toFixed(2)),
      remark: dto.remark ?? '',
      createdAt: new Date().toISOString(),
    };
    this.cashFlows.push(record);
    return record;
  }

  recordInternal(
    portfolioId: number,
    type: CashFlowType.BUY | CashFlowType.SELL | CashFlowType.DIVIDEND,
    amount: number,
    balanceAfter: number,
    remark = '',
  ) {
    const record: CashFlowRecord = {
      id: this.nextId++,
      portfolioId,
      type,
      amount: Number(amount.toFixed(2)),
      balanceAfter: Number(balanceAfter.toFixed(2)),
      remark,
      createdAt: new Date().toISOString(),
    };
    this.cashFlows.push(record);
    return record;
  }
}
