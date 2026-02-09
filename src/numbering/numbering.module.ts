import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumberingCustomer } from './entities/numbering-customer.entity';
import { NumberingDocument } from './entities/numbering-document.entity';
import { NumberingCustomerService } from './numbering-customer.service';
import { NumberingController } from './numbering.controller';
import { NumberingDocumentService } from './numbering-document.service';

@Module({
  imports: [TypeOrmModule.forFeature([NumberingCustomer, NumberingDocument])],
  controllers: [NumberingController],
  providers: [NumberingCustomerService, NumberingDocumentService],
  exports: [NumberingCustomerService, NumberingDocumentService],
})
export class NumberingModule {}
