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
import { CHATS_PER_PAGE, MESSAGES_PER_PAGE } from '../utils/constants';

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
      //check if verified user
      const buyerUser = await this.usersService.getUserBy(userId);
      if (!buyerUser.isVerified)
        throw new BadRequestException('your user is not verified yet');

      chat = this.chatRepository.create({
        item: { id: itemId },
        buyer: { id: userId },
        seller: { id: item.user.id },
      });
      await this.chatRepository.save(chat);
    }
    return chat;
  }

  async getChatMessages(chatId: number, userId: number, page?: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: { buyer: true, seller: true, item: true },
    });
    if (!chat || (chat.buyer.id !== userId && chat.seller.id !== userId)) {
      throw new UnauthorizedException('not allowed to see this conversation');
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.id id',
        'message.content content',
        'message.createdAt createdAt',
        'message.senderId senderId',
        'message.isRead isRead',
        'message.receiverId receiverId',
      ])
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'DESC');

    //for pagination
    const totalMessages = await query.getCount();
    const limit = MESSAGES_PER_PAGE;
    const skip = limit * ((page ?? 1) - 1);
    query.skip(skip).take(limit);

    const messages = await query.getRawMany();
    return { messages, totalMessages };
  }

  async getUserInbox(userId: number, page?: number, itemId?: number) {
    const query = this.chatRepository
      .createQueryBuilder('chat')
      .where('(chat.buyerId = :userId OR chat.sellerId = :userId)', {
        userId,
      });

    if (itemId) {
      query.andWhere('chat.itemId = :itemId', { itemId });
    }
    query
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
      .orderBy('chat.updatedAt', 'DESC');

    //for pagination
    const totalChats = await query.getCount();
    const limit = CHATS_PER_PAGE;
    const skip = limit * ((page ?? 1) - 1);
    query.skip(skip).take(limit);

    const { entities, raw } = await query.getRawAndEntities();
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

    return { chats, totalChats };
  }

  async markMessagesAsRead(chatId: number, receiverId: number) {
    await this.messageRepository.update(
      { chat: { id: chatId }, receiver: { id: receiverId }, isRead: false },
      { isRead: true },
    );
    return 'messages read successfully';
  }

  async saveMessage(
    chatId: number,
    senderId: number,
    receiverId: number,
    content: string,
  ) {
    const message = this.messageRepository.create({
      chat: { id: chatId },
      sender: { id: senderId },
      receiver: { id: receiverId },
      content,
    });

    return await this.messageRepository.save(message);
  }

  async verifyConversationAccess(chatId: number, userId: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      select: ['id', 'buyer', 'seller'],
      relations: { buyer: true, seller: true },
    });

    if (!chat) {
      throw new Error('not found this conversation');
    }

    if (chat.buyer.id !== userId && chat.seller.id !== userId) {
      throw new Error('not allowed to reach this chat');
    }

    return chat;
  }
}
