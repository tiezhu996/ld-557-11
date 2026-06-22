import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CashFlowType } from '../../../constants/enums';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';

@Entity('cash_flows')
export class CashFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  portfolioId: number;

  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  portfolio: Portfolio;

  @Column({ type: 'enum', enum: CashFlowType })
  type: CashFlowType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balanceAfter: string;

  @Column({ type: 'text', default: '' })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}
