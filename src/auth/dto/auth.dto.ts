import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  birthdate: string;

  @IsOptional()
  phoneNumber?: string;
}

export class SigninDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
