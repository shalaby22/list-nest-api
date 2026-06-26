import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class JoinConversationDto {
  @Type(() => Number)
  @IsInt({ message: 'chatId must be an integer' })
  @Min(1)
  chatId: number;
}
