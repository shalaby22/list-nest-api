import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { ItemsModule } from './items/items.module';
import { Item } from './items/entities/item.entity';
import { ImageItem } from './items/entities/image-item.entity';
import { City } from './items/entities/city.entity';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { Country } from './items/entities/country.entity';
import { Region } from './items/entities/region.entity';
import { WishlistModule } from './wishlist/wishlist.module';
import { Wishlist } from './wishlist/wishlist.entity';
import { ChatsModule } from './chats/chats.module';
import { Chat } from './chats/entities/chat.entity';
import { Message } from './chats/entities/message.entity';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
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
        //warning from synchronize only for development todo
        //todo add PostGIS to postgres in migrations
        //todo add pg_trgm to postgres in migrations
        //todo add two indices in migration
        // CREATE INDEX idx_items_search ON public.item USING GIN("searchVector");
        //CREATE INDEX idx_items_title_trgm ON public.item USING GIN(title gin_trgm_ops);
        //add another indices على زوقك
        //installExtensions - A boolean to control whether to install necessary postgres extensions automatically or not (default: true)
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
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
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          db: 2,
        },
      }),
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
