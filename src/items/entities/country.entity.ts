import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Region } from './region.entity';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  country: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Region, (region) => region.country)
  regions: Region[];
}
