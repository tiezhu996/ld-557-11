import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioType, RiskLevel, UserRole } from '../../constants/enums';
import { ROLE_LIMITS } from '../../constants/permissions';
import { CurrentUser } from '../../types/request';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

export interface PortfolioRecord {
  id: number;
  userId: number;
  name: string;
  description: string;
  type: PortfolioType;
  riskLevel: RiskLevel;
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  createdAt: string;
}

@Injectable()
export class PortfoliosService {
  private readonly portfolios: PortfolioRecord[] = [
    { id: 1, userId: 1, name: '长期价值组合', description: '宽基 ETF + 龙头股票', type: PortfolioType.MIXED, riskLevel: RiskLevel.MODERATE, cashBalance: 0, holdingsValue: 1952, totalValue: 1952, createdAt: new Date().toISOString() },
  ];
  private nextId = 2;

  list(user: CurrentUser) {
    return user.role === UserRole.ADMIN ? this.portfolios : this.portfolios.filter((item) => item.userId === user.id);
  }

  findOwned(id: number, user: CurrentUser) {
    const portfolio = this.portfolios.find((item) => item.id === id);
    if (!portfolio) throw new NotFoundException('portfolio not found');
    if (user.role !== UserRole.ADMIN && portfolio.userId !== user.id) throw new ForbiddenException('not portfolio owner');
    return portfolio;
  }

  create(dto: CreatePortfolioDto, user: CurrentUser) {
    const ownedCount = this.portfolios.filter((item) => item.userId === user.id).length;
    if (ownedCount >= ROLE_LIMITS[user.role].maxPortfolios) throw new ForbiddenException('portfolio limit reached');

    const portfolio: PortfolioRecord = {
      id: this.nextId++,
      userId: user.id,
      name: dto.name,
      description: dto.description ?? '',
      type: dto.type,
      riskLevel: dto.riskLevel,
      cashBalance: 0,
      holdingsValue: 0,
      totalValue: 0,
      createdAt: new Date().toISOString(),
    };
    this.portfolios.push(portfolio);
    return portfolio;
  }

  update(id: number, dto: UpdatePortfolioDto, user: CurrentUser) {
    const portfolio = this.findOwned(id, user);
    Object.assign(portfolio, dto);
    return portfolio;
  }

  delete(id: number, user: CurrentUser) {
    const portfolio = this.findOwned(id, user);
    const index = this.portfolios.findIndex((item) => item.id === portfolio.id);
    this.portfolios.splice(index, 1);
    return { deleted: true, id };
  }

  getCashBalance(id: number) {
    const portfolio = this.portfolios.find((item) => item.id === id);
    return portfolio ? portfolio.cashBalance : 0;
  }

  addCash(id: number, amount: number) {
    const portfolio = this.portfolios.find((item) => item.id === id);
    if (portfolio) {
      portfolio.cashBalance = Number((portfolio.cashBalance + amount).toFixed(2));
      portfolio.totalValue = Number((portfolio.holdingsValue + portfolio.cashBalance).toFixed(2));
      return portfolio.cashBalance;
    }
    return 0;
  }

  setHoldingsValue(id: number, value: number) {
    const portfolio = this.portfolios.find((item) => item.id === id);
    if (portfolio) {
      portfolio.holdingsValue = Number(value.toFixed(2));
      portfolio.totalValue = Number((portfolio.holdingsValue + portfolio.cashBalance).toFixed(2));
    }
  }

  setTotalValue(id: number, value: number) {
    const portfolio = this.portfolios.find((item) => item.id === id);
    if (portfolio) portfolio.totalValue = Number(value.toFixed(2));
  }

  performance(id: number, user: CurrentUser) {
    const portfolio = this.findOwned(id, user);
    return {
      portfolioId: portfolio.id,
      totalValue: portfolio.totalValue,
      daily: 0.38,
      weekly: 1.24,
      monthly: 3.9,
      yearly: 12.6,
      points: ['日', '周', '月', '年'].map((label, index) => ({ label, returnPercent: [0.38, 1.24, 3.9, 12.6][index] })),
    };
  }
}

