import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from './order.entity';

@Entity()
@Unique(['email'])
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
