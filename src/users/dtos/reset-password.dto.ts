import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @ApiProperty({ example: 'received_string_token' })
  token: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'NewStrongPass123!' })
  password: string;
}
