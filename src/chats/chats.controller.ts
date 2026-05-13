import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../users/auth/guards/jwt-auth.guard';
import { User } from '../users/auth/decorators/user.decorator';
import type { JwtPayloadType } from '../utils/types';

@Controller('api/chats')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('start/:itemId')
  startConversation(
    @User() jwtPayload: JwtPayloadType,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.chatsService.startConversation(jwtPayload.id, itemId);
  }

  @Get('inbox')
  getInbox(@User() jwtPayload: JwtPayloadType) {
    return this.chatsService.getUserInbox(jwtPayload.id);
  }

  @Get('inbox/:chatId')
  getChatsOfItem(
    @User() jwtPayload: JwtPayloadType,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chatsService.getUserInbox(jwtPayload.id, chatId);
  }

  @Get(':chatId')
  getChatMessages(
    @User() jwtPayload: JwtPayloadType,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.chatsService.getChatMessages(chatId, jwtPayload.id, page);
  }

  @Patch(':chatId')
  markMessagesAsRead(
    @User() jwtPayload: JwtPayloadType,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chatsService.markMessagesAsRead(chatId, jwtPayload.id);
  }
}
