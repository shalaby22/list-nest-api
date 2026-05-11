import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Country } from './country.entity';
import { City } from './city.entity';

@Entity()
export class Region {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  region: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Country, (country) => country.regions, {
    eager: true,
    cascade: ['insert'],
  })
  country: Country;

  @OneToMany(() => City, (city) => city.region)
  cities: City[];
}
