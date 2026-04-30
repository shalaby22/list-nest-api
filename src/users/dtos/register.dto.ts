import {
  IsEmail,
  IsMobilePhone,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsMobilePhone()
  phone: string;

  @IsString()
  @MinLength(3)
  @MaxLength(18)
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(18)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(18)
  lastName: string;
}
