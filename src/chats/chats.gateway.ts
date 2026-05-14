import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { Server, Socket } from 'socket.io';
import { ParseIntPipe, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../users/auth/guards/ws-jwt-auth.guard';
import type { AuthenticatedSocket } from '../utils/interfaces';
import { WsThrottlerGuard } from '../users/auth/guards/ws-throttler.guard';

@WebSocketGateway({
  namespace: '/api/socket/chats',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
@UseGuards(WsThrottlerGuard)
export class ChatsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatsService: ChatsService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(
      'chatId',
      new ParseIntPipe({
        exceptionFactory: (error) => {
          throw new WsException(error);
        },
      }),
    )
    chatId: number,
  ) {
    try {
      const userId = client.user.id;

      await this.chatsService.verifyConversationAccess(chatId, userId);
      const roomName = chatId.toString();
      await client.join(roomName);

      console.log(`User ${userId} securely joined room ${roomName}`);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'unKnown error';
      throw new WsException(message);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { chatId: number; content: string },
  ) {
    try {
      const senderId = client.user.id;

      const chat = await this.chatsService.verifyConversationAccess(
        payload.chatId,
        senderId,
      );

      const receiverId =
        chat.buyer.id === senderId ? chat.seller.id : chat.buyer.id;

      const savedMessage = await this.chatsService.saveMessage(
        payload.chatId,
        senderId,
        receiverId,
        payload.content,
      );

      this.server
        .to(payload.chatId.toString())
        .emit('receive_message', savedMessage);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'unKnown error';
      throw new WsException(message);
    }
  }
}

//todo notfication ان جات رسالة وانت برا المحادثات
