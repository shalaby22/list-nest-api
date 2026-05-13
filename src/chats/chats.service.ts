import { UsersService } from './../users/users.service';
import { ItemsService } from './../items/items.service';
import { Message } from './entities/message.entity';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { RawChatData } from '../utils/interfaces';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private itemsService: ItemsService,
    private usersService: UsersService,
  ) {}

  async startConversation(userId: number, itemId: number) {
    const item = await this.itemsService.findOne(itemId);
    if (userId === item.user.id) {
      throw new BadRequestException(`can't start conversation with your self`);
    }
    let chat = await this.chatRepository.findOne({
      where: { item: { id: itemId }, buyer: { id: userId } },
    });
    if (!chat) {
      const buyerUser = await this.usersService.getUserBy(userId);
      console.log(buyerUser);
      chat = this.chatRepository.create({
        item: { id: itemId },
        buyer: { id: userId },
        seller: { id: item.user.id },
      });
      await this.chatRepository.save(chat);
    }
    return chat;
  }

  async getChatMessages(chatId: number, userId: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: { buyer: true, seller: true, item: true },
    });
    if (!chat || (chat.buyer.id !== userId && chat.seller.id !== userId)) {
      throw new UnauthorizedException('not allowed to see this conversation');
    }

    return this.messageRepository.find({
      where: { chat: { id: chatId } },
      order: { createdAt: 'desc' },
    });
    //todo pagination
  }

  async getUserInbox(userId: number) {
    const { entities, raw } = await this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.buyerId = :userId OR chat.sellerId = :userId', {
        userId,
      })
      .leftJoinAndSelect('chat.messages', 'message')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(message.id)')
          .from('message', 'message')
          .where('message.chatId = chat.id')
          .andWhere('message.receiverId = :userId', { userId })
          .andWhere('message.isRead = false');
      }, 'unreadCount')
      .leftJoinAndSelect('chat.item', 'item')
      .leftJoinAndSelect('chat.buyer', 'buyer')
      .leftJoinAndSelect('chat.seller', 'seller')
      .orderBy('chat.updatedAt', 'DESC')
      .getRawAndEntities();

    const unreadCountMap = new Map();
    raw.forEach((ele: RawChatData) => {
      unreadCountMap.set(ele.chat_id, +ele.unreadCount);
    });

    const chats = entities.map((chat) => {
      const unreadCount: number = unreadCountMap.get(chat.id) as number;
      return {
        ...chat,
        unreadCount: unreadCount || 0,
      };
    });

    return chats;
  }

  async markMessagesAsRead(chatId: number, receiverId: number) {
    await this.messageRepository.update(
      { chat: { id: chatId }, receiver: { id: receiverId }, isRead: false },
      { isRead: true },
    );
    return 'messages read successfully';
  }

  //todo send message
}
