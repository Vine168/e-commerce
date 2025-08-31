import { IsString, IsInt, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString()
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
}
