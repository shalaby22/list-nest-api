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
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('api/chats')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('start/:itemId')
  @ApiOperation({
    summary: 'Start a new conversation regarding a specific item',
    description: `
### 🔌 **WebSockets (Socket.io) Integration Guide**

After calling this HTTP endpoint to initialize or get the chat session, you must switch to WebSockets for real-time communication.

#### **1. Connection Details**
- **Gateway Namespace URL:** \`ws://https://list-nest-api-production.up.railway.app/api/socket/chats\`
- **Authentication:** You must pass the JWT Access Token in the handshake headers or auth object:
  \`\`\`javascript
  const socket = io("ws://https://list-nest-api-production.up.railway.app/api/socket/chats", {
    auth: { token: "Bearer YOUR_ACCESS_TOKEN" }
  });
  \`\`\`

#### **2. Joining a Chat Room**
When the user opens a specific chat screen, they must join the room to start exchanging messages:
- **Emit Event:** \`join_conversation\`
- **Payload:** \`{ chatId: number }\`

#### **3. Real-Time Messaging**
- **To Send a Message:** Emit \`send_message\` with payload: \`{ chatId: number, content: string }\`
- **To Receive Messages:** Listen to the event \`receive_message\` inside the room. It returns the complete saved message object in real-time.
    `,
  })
  startConversation(
    @User() jwtPayload: JwtPayloadType,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.chatsService.startConversation(jwtPayload.id, itemId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get current user inbox (list of chats)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for chats pagination',
  })
  getInbox(
    @User() jwtPayload: JwtPayloadType,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.chatsService.getUserInbox(jwtPayload.id, page);
  }

  @Get('inbox/:itemId')
  @ApiOperation({ summary: 'Get current user chats of a specific item' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for chats pagination',
  })
  getChatsOfItem(
    @User() jwtPayload: JwtPayloadType,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.chatsService.getUserInbox(jwtPayload.id, page, itemId);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get paginated messages of a specific chat' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for messages pagination',
  })
  getChatMessages(
    @User() jwtPayload: JwtPayloadType,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.chatsService.getChatMessages(chatId, jwtPayload.id, page);
  }

  @Patch(':chatId')
  @ApiOperation({ summary: 'Mark all messages in a specific chat as read' })
  markMessagesAsRead(
    @User() jwtPayload: JwtPayloadType,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chatsService.markMessagesAsRead(chatId, jwtPayload.id);
  }
}
