import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortalLoginDto {
  @ApiProperty({ example: '+48500123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'haslo123' })
  @IsString()
  @MinLength(4)
  password: string;
}

export class PortalChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class PortalResetPasswordDto {
  @ApiProperty({ example: '+48500123456' })
  @IsString()
  phone: string;
}

export class CreatePortalAccessDto {
  @ApiProperty()
  @IsString()
  customerId: string;
}
