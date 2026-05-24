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
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from '../utils/types';
import { extractJwtFromSocket } from '../users/auth/ws-jwt.strategy';

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

  constructor(
    private readonly chatsService: ChatsService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    server.use((client: Socket, next) => {
      try {
        const token = extractJwtFromSocket(client);
        if (!token) throw new Error('Token is missing');

        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const payload = this.jwtService.verify<JwtPayloadType>(token, {
          secret,
        });

        const user = { id: payload.id, userType: payload.userType };
        if (!user) throw new Error('Invalid user payload');

        client['user'] = user;
        next();
      } catch (error: any) {
        console.log(`Connection rejected: ${error}`);
        next(new Error(`Connection rejected: ${error}`));
      }
    });
  }

  async handleConnection(client: AuthenticatedSocket) {
    await client.join(`user_notify_${client.user.id}`);
    console.log(`User ${client.user.id} joined notification room`);
  }

  // handleDisconnect(client: Socket) {
  //   // console.log(`Client disconnected: ${client.id}`);
  // }

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

      this.server
        .to(`user_notify_${receiverId}`)
        .emit('new_message_notification', {
          title: 'new message',
          body: payload.content,
          chatId: payload.chatId,
        });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'unKnown error';
      throw new WsException(message);
    }
  }
}
