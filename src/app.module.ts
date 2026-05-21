import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';

import { ItemsModule } from './items/items.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ChatsModule } from './chats/chats.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { dataSourceOptions } from '../db/data.source';
import { config } from 'dotenv';
config({ path: '.env' });

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(dataSourceOptions),
    CategoriesModule,
    ItemsModule,
    CloudinaryModule,
    WishlistModule,
    ChatsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 10,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 30,
        },
      ],
    }),
    MailModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        let connectionOptions: {
          host?: string;
          port?: number;
          password?: string;
          username?: string;
          tls?: any;
          db?: number;
          keepAlive?: number;
          connectTimeout?: number;
          retryStrategy?: any;
          maxRetriesPerRequest?: any;
        } = {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          db: 2,
        };
        if (redisUrl) {
          const parsedUrl = new URL(redisUrl);
          connectionOptions = {
            host: parsedUrl.hostname,
            port: Number(parsedUrl.port),
            password: parsedUrl.password,
            username: parsedUrl.username,
            db: 0,
            maxRetriesPerRequest: null,
            keepAlive: 30000,
            connectTimeout: 30000,
            retryStrategy: (times: number) => Math.min(times * 100, 3000),
          };
        }

        return {
          connection: connectionOptions,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

//local dataBase
// import { User } from './users/users.entity';
// import { Category } from './categories/entities/category.entity';
// import { Item } from './items/entities/item.entity';
// import { ImageItem } from './items/entities/image-item.entity';
// import { City } from './items/entities/city.entity';
// import { Country } from './items/entities/country.entity';
// import { Region } from './items/entities/region.entity';
// import { Wishlist } from './wishlist/wishlist.entity';
// import { Chat } from './chats/entities/chat.entity';
// import { Message } from './chats/entities/message.entity';
// {
//       useFactory: (configService: ConfigService) => ({
//         type: 'postgres',
//         host: configService.get('DATABASE_HOST'),
//         port: configService.get('DATABASE_PORT'),
//         username: configService.get('DATABASE_USER'),
//         password: configService.get('DATABASE_PASSWORD'),
//         database: configService.get('DATABASE_NAME'),
//         entities: [
//           User,
//           Category,
//           Item,
//           ImageItem,
//           City,
//           Country,
//           Region,
//           Wishlist,
//           Chat,
//           Message,
//         ],
//         //warning from synchronize only for development
//         //add PostGIS to postgres in migrations
//         //add pg_trgm to postgres in migrations
//         //add two indices in migration
//         // CREATE INDEX idx_items_search ON public.item USING GIN("searchVector");
//         //CREATE INDEX idx_items_title_trgm ON public.item USING GIN(title gin_trgm_ops);
//         synchronize: true,
//       }),
//       inject: [ConfigService],
//     }
