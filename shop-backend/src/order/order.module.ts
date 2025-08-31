import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BakongModule } from '../bakong/bakong.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [BakongModule, TelegramModule, PdfModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
