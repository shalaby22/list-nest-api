import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { Chat } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ItemsModule } from '../items/items.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService],
  imports: [
    TypeOrmModule.forFeature([Chat, Message]),
    ItemsModule,
    UsersModule,
  ],
})
export class ChatsModule {}
