import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Invoice } from './invoice.entity';

@Entity('sales_orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'timestamptz', nullable: true })
  placedAt: Date | null;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_ref' })
  customer: Customer;

  @OneToOne(() => Invoice)
  invoice: Invoice;

  @ManyToOne(() => Warehouse)
  warehouse: Warehouse;
}
