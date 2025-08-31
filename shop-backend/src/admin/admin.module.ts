import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [ProductModule, OrderModule],
  controllers: [AdminController],
})
export class AdminModule {}
