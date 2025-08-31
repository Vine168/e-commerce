import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productService.create(createProductDto);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'Product with this slug already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to create product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.productService.findAll();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const product = await this.productService.findOne(id);
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      return product;
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    try {
      const product = await this.productService.findBySlug(slug);
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      return product;
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      const product = await this.productService.update(id, updateProductDto);
      return product;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      if (error.code === 'P2002') {
        throw new HttpException(
          'Product with this slug already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.productService.remove(id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to delete product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
