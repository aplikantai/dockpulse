import { IsString, IsArray, IsOptional, IsNumber, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'ID produktu' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Ilość', example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class DeliveryAddressDto {
  @ApiProperty({ example: 'ul. Kwiatowa 15' })
  @IsString()
  street: string;

  @ApiProperty({ example: '00-001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'Warszawa' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Polska' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreatePortalOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Lista produktów' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Notatki do zamówienia' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: DeliveryAddressDto, description: 'Adres dostawy' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional({ description: 'Preferowana data dostawy', example: '2025-01-15' })
  @IsOptional()
  @IsString()
  deliveryDate?: string;
}

export class RejectQuoteDto {
  @ApiPropertyOptional({ description: 'Powód odrzucenia wyceny' })
  @IsOptional()
  @IsString()
  reason?: string;
}
