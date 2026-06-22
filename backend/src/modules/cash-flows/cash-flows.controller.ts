import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../types/request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashFlowsService } from './cash-flows.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { CashFlowType } from '../../constants/enums';

@ApiTags('cash-flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios/:portfolioId/cash-flows')
export class CashFlowsController {
  constructor(private readonly cashFlowsService: CashFlowsService) {}

  @Get()
  list(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.cashFlowsService.listByPortfolio(portfolioId, user, Number(page), Number(pageSize));
  }

  @Post()
  create(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Body() dto: CreateCashFlowDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    if (dto.type === CashFlowType.DEPOSIT) {
      return this.cashFlowsService.deposit(portfolioId, dto, user);
    }
    return this.cashFlowsService.withdraw(portfolioId, dto, user);
  }
}
