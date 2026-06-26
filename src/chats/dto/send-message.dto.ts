import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
  @Type(() => Number)
  @IsInt({ message: 'chatId must be an integer' })
  @Min(1)
  chatId: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MaxLength(1000, { message: 'Message is too long (max 1000 characters)' })
  content: string;
}
