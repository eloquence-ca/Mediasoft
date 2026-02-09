import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './entities/bill.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Payment } from './entities/payment.entity';
import { PaymentMethodService } from './payment-method.service';
import { BillService } from './bill.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, PaymentMethod, Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentMethodService, BillService],
  exports: [PaymentService, BillService],
})
export class PaymentModule {}
