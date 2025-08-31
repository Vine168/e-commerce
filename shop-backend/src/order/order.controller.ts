import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  HttpException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      return await this.orderService.create(createOrderDto);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/khqr')
  async generateKHQR(@Param('id') id: string) {
    try {
      return await this.orderService.generateKHQR(id);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        'Failed to generate KHQR',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/status')
  async checkPaymentStatus(@Param('id') id: string) {
    try {
      return await this.orderService.checkPaymentStatus(id);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        'Failed to check payment status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.orderService.findAll();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch orders',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.orderService.findOne(id);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    try {
      return await this.orderService.updateStatus(id, updateOrderStatusDto);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        'Failed to update order status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload-receipt')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads/receipts',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExtName = extname(file.originalname);
          callback(null, `receipt-${uniqueSuffix}${fileExtName}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadReceipt(
    @UploadedFile() file: any,
    @Body() body: { orderId: string; amount: number; customerName: string },
  ) {
    try {
      return await this.orderService.processReceiptUpload(file, body);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload receipt',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
