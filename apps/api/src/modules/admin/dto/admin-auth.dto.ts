import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Admin Login DTO
 */
export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * Admin Login Response
 */
export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}
