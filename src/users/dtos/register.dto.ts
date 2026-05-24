import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsMobilePhone,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'mohamed@example.com',
    description: 'must be unique',
  })
  @IsString()
  @IsEmail()
  email: string;
  //make password and email stronger

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'not less than 8 chars',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: '0201012345678',
    description: 'phone number',
  })
  @IsMobilePhone()
  phone: string;

  @ApiProperty({
    example: 'user2',
    description: 'user name for user',
    minLength: 3,
    maxLength: 18,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(18)
  username: string;

  @ApiProperty({
    example: 'Mohamed',
    description: 'firstName',
    minLength: 2,
    maxLength: 18,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(18)
  firstName: string;

  @ApiProperty({
    example: 'Mohamed',
    description: 'lastName',
    minLength: 2,
    maxLength: 18,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(18)
  lastName: string;
}
