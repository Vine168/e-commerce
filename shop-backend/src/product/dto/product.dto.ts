import { IsString, IsInt, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  priceCents?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
