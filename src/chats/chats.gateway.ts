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
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from '../users/auth/guards/ws-jwt-auth.guard';
import type { AuthenticatedSocket } from '../utils/interfaces';
import { WsThrottlerGuard } from '../users/auth/guards/ws-throttler.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from '../utils/types';
import { extractJwtFromSocket } from '../users/auth/strategies/ws-jwt.strategy';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';

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

  /**
   * Hook middleware guard checking handshake query/header tokens on setup initialization.
   */
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
        next(new Error(`Connection rejected: ${error}`));
      }
    });
  }

  // =========================================================================

  /**
   * automatically allocate user-scoped notification channels.
   */
  async handleConnection(client: AuthenticatedSocket) {
    await client.join(`user_notify_${client.user.id}`);
    // console.log(`User ${client.user.id} joined notification room`);
  }

  // handleDisconnect(client: Socket) {
  //   // console.log(`Client disconnected: ${client.id}`);
  // }

  // =========================================================================

  /**
   * WS Event: join_conversation
   * Description: Registers a client into a room representing a chat.
   */
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new WsException(errors);
      },
    }),
  )
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() { chatId }: JoinConversationDto,
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

  // =========================================================================

  /**
   * WS Event: send_message
   * Description: Commits real-time messages to storage and alerts to room listeners and user notification channels.
   */
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new WsException(errors);
      },
    }),
  )
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessageDto,
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
