import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ouvrage } from './entities/ouvrage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ouvrage])],
  controllers: [],
  providers: [],
  exports: [],
})
export class OuvrageModule {}
