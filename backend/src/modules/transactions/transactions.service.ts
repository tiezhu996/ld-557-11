import { BadRequestException, Injectable } from '@nestjs/common';
import { CashFlowType, TransactionType } from '../../constants/enums';
import { CurrentUser } from '../../types/request';
import { paginate } from '../../utils/pagination';
import { CashFlowsService } from '../cash-flows/cash-flows.service';
import { HoldingsService } from '../holdings/holdings.service';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

export interface TransactionRecord {
  id: number;
  holdingId: number;
  portfolioId: number;
  type: TransactionType;
  quantity: number;
  price: number;
  fee: number;
  executedAt: string;
}

@Injectable()
export class TransactionsService {
  private readonly transactions: TransactionRecord[] = [
    { id: 1, holdingId: 1, portfolioId: 1, type: TransactionType.BUY, quantity: 10, price: 180, fee: 1, executedAt: new Date().toISOString() },
  ];
  private nextId = 2;

  constructor(
    private readonly holdingsService: HoldingsService,
    private readonly portfoliosService: PortfoliosService,
    private readonly cashFlowsService: CashFlowsService,
  ) {}

  listByHolding(holdingId: number, user: CurrentUser) {
    this.holdingsService.findOwned(holdingId, user);
    return this.transactions.filter((item) => item.holdingId === holdingId);
  }

  listByPortfolio(portfolioId: number, user: CurrentUser, page = 1, pageSize = 20) {
    this.holdingsService.listByPortfolio(portfolioId, user);
    return paginate(this.transactions.filter((item) => item.portfolioId === portfolioId), page, pageSize);
  }

  create(holdingId: number, dto: CreateTransactionDto, user: CurrentUser) {
    const holding = this.holdingsService.findOwned(holdingId, user);
    const cashAmount = dto.quantity * dto.price + (dto.type === TransactionType.SELL ? -(dto.fee ?? 0) : (dto.fee ?? 0));

    if (dto.type === TransactionType.BUY) {
      const currentCash = this.portfoliosService.getCashBalance(holding.portfolioId);
      if (currentCash < cashAmount) {
        throw new BadRequestException('insufficient cash balance');
      }
    }

    const transaction: TransactionRecord = {
      id: this.nextId++,
      holdingId,
      portfolioId: holding.portfolioId,
      type: dto.type,
      quantity: dto.quantity,
      price: dto.price,
      fee: dto.fee ?? 0,
      executedAt: dto.executedAt ?? new Date().toISOString(),
    };
    this.transactions.push(transaction);
    this.holdingsService.applyTransaction(holdingId, dto.quantity, dto.price, dto.type, user);

    if (dto.type === TransactionType.BUY) {
      const balanceAfter = this.portfoliosService.addCash(holding.portfolioId, -cashAmount);
      this.cashFlowsService.recordInternal(holding.portfolioId, CashFlowType.BUY, cashAmount, balanceAfter, `买入 ${holding.symbol} x${dto.quantity}`);
    } else if (dto.type === TransactionType.SELL) {
      const proceed = dto.quantity * dto.price - (dto.fee ?? 0);
      const balanceAfter = this.portfoliosService.addCash(holding.portfolioId, proceed);
      this.cashFlowsService.recordInternal(holding.portfolioId, CashFlowType.SELL, proceed, balanceAfter, `卖出 ${holding.symbol} x${dto.quantity}`);
    } else if (dto.type === TransactionType.DIVIDEND) {
      const balanceAfter = this.portfoliosService.addCash(holding.portfolioId, cashAmount);
      this.cashFlowsService.recordInternal(holding.portfolioId, CashFlowType.DIVIDEND, cashAmount, balanceAfter, `分红 ${holding.symbol}`);
    }

    return transaction;
  }
}
