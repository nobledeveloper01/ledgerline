import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Invoice {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column()
  reference: string;
}
