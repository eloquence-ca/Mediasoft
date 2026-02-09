import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerIndividual } from './entities/customer-individual.entity';
import { CustomerPublicEntity } from './entities/customer-public-entity.entity';
import { CustomerProfessional } from './entities/customer-professional.entity';
import { Customer } from './entities/customer.entity';
import { Address } from 'src/address/entities/address.entity';
import { Contact } from 'src/contact/entities/contact.entity';
import { InternalNote } from 'src/internal-note/entities/internal-note.entity';
import { NumberingModule } from 'src/numbering/numbering.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Address,
      Contact,
      InternalNote,
      Customer,
      CustomerIndividual,
      CustomerPublicEntity,
      CustomerProfessional,
    ]),
    NumberingModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
