import { Module } from '@nestjs/common';
import { TvaRateService } from './tva-rate.service';
import { TvaRateController } from './tva-rate.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TvaRate } from './entities/tva-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TvaRate])],
  controllers: [TvaRateController],
  providers: [TvaRateService],
  exports: [TvaRateService],
})
export class TvaRateModule {}
