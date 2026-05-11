import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { Region } from './region.entity';

@Entity()
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  city: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Item, (item) => item.city)
  items: Item[];

  @ManyToOne(() => Region, (region) => region.cities, {
    eager: true,
    cascade: ['insert'],
  })
  region: Region;
}
