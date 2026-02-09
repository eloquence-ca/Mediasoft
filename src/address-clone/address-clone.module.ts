import { Module } from '@nestjs/common';
import { AddressCloneService } from './address-clone.service';
import { AddressClone } from './entities/address-clone.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityModule } from 'src/city/city.module';

@Module({
  imports: [TypeOrmModule.forFeature([AddressClone]), CityModule],
  controllers: [],
  providers: [AddressCloneService],
  exports: [AddressCloneService],
})
export class AddressCloneModule {}
