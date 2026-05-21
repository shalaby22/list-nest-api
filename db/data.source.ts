import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../src/users/users.entity';
import { Message } from '../src/chats/entities/message.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Item } from '../src/items/entities/item.entity';
import { ImageItem } from '../src/items/entities/image-item.entity';
import { City } from '../src/items/entities/city.entity';
import { Country } from '../src/items/entities/country.entity';
import { Region } from '../src/items/entities/region.entity';
import { Wishlist } from '../src/wishlist/wishlist.entity';
import { Chat } from '../src/chats/entities/chat.entity';
import { config } from 'dotenv';

config({ path: '.env' });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: ['error', 'warn'],
  logger: 'advanced-console',
  entities: [
    User,
    Category,
    Item,
    ImageItem,
    City,
    Country,
    Region,
    Wishlist,
    Chat,
    Message,
  ],
  migrations: ['dist/db/migrations/*.js'],
};
export const AppDataSource = new DataSource(dataSourceOptions);
