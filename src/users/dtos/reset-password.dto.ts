import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @ApiProperty({ example: 'received_string_token' })
  token: string;

  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  @ApiProperty({ example: 'NewStrongPass123!' })
  password: string;
}
