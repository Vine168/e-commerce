import { Module } from '@nestjs/common';
import { BakongService } from './bakong.service';

@Module({
  providers: [BakongService],
  exports: [BakongService],
})
export class BakongModule {}
