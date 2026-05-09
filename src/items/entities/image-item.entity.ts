import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class ImageItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  link: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Item, (item) => item.images, { onDelete: 'CASCADE' })
  item: Item;
}
