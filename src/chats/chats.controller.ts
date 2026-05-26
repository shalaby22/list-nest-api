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

  // =========================================================================

  /**
   * [POST] /api/chats/start/:itemId
   * Access: verified Users
   * Description: Start a new conversation regarding a specific item
   */
  @Post('start/:itemId')
  @ApiOperation({
    summary: 'Start a new conversation regarding a specific item',
    description: `
### 🔌 **WebSockets (Socket.io) Integration Guide**

After calling this HTTP endpoint to initialize or retrieve a chat session, you must establish a WebSocket connection for real-time messaging and notifications.

#### **1. Connection Details**
- **Endpoint:** \`/api/socket/chats\`
- **Authentication:** You MUST pass the JWT Access Token in the connection headers. 
*(If using Postman Socket.io, add it in the "Headers" tab as shown below)*:
  \`\`\`json
  { "Authorization": "Bearer YOUR_ACCESS_TOKEN" }
  \`\`\`
*(For client libraries like socket.io-client)*:
  \`\`\`javascript
  const socket = io("wss://list-nest-api-production.up.railway.app/api/socket/chats", {
    extraHeaders: {
      Authorization: "Bearer YOUR_ACCESS_TOKEN"
    }
  });
  \`\`\`

#### **2. Joining a Chat Room (Active Chat)**
When a user explicitly opens a chat screen, they must join that specific room to send/receive direct messages.
- **Emit Event:** \`join_conversation\`
- **Payload:** \`{ "chatId": number }\`

#### **3. Emitting & Listening to Events**
Once connected, the client should listen for and emit the following events:

| Event Name | Type | Description | Payload Structure |
| :--- | :--- | :--- | :--- |
| **\`send_message\`** | **Emit** | Send a new message to the active chat room. | \`{ "chatId": number, "content": "string" }\` |
| **\`receive_message\`** | **Listen** | Triggered when a new message is sent in the currently active chat room. | Returns the complete \`Message\` object. |
| **\`new_message_notification\`** | **Listen** | Triggered globally when the user receives a message in ANY chat (useful for idle/offline UI updates or badges). | Returns partial info (e.g., \`chatId\`, \`senderName\`). |
| **\`exception\`** | **Listen** | Catches WebSocket errors (e.g., Unauthorized, Room access denied, Validation errors). | \`{ "status": "error", "message": "string" }\` |
    `,
  })
  startConversation(
    @User() jwtPayload: JwtPayloadType,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.chatsService.startConversation(jwtPayload.id, itemId);
  }

  // =========================================================================

  /**
   * [GET] /api/chats/inbox
   * Access: verified Users
   * Description: Get current user inbox (list of chats) with pagination
   */
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

  // =========================================================================

  /**
   * [GET] /api/chats/inbox/:itemId
   * Access: verified Users
   * Description: Get current user chats associated with a specific item
   */
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

  // =========================================================================

  /**
   * [GET] /api/chats/:chatId
   * Access: verified Users
   * Description: Get paginated messages of a specific chat
   */
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

  // =========================================================================

  /**
   * [PATCH] /api/chats/:chatId
   * Access: verified Users
   * Description: Mark all unread messages in a specific chat as read
   */
  @Patch(':chatId')
  @ApiOperation({ summary: 'Mark all messages in a specific chat as read' })
  markMessagesAsRead(
    @User() jwtPayload: JwtPayloadType,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chatsService.markMessagesAsRead(chatId, jwtPayload.id);
  }
}
