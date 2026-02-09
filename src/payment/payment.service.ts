import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { Bill } from './entities/bill.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = this.paymentRepository.create({
        idCustomer: createPaymentDto.idCustomer,
        idPaymentMethod: createPaymentDto.idPaymentMethod,
        ref: createPaymentDto.ref,
        montant: createPaymentDto.montant,
        date: createPaymentDto.date,
        dueDate: createPaymentDto.dueDate,
        paymentDate: createPaymentDto.paymentDate,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      if (createPaymentDto.bills && createPaymentDto.bills.length > 0) {
        const bills = createPaymentDto.bills.map((billDto) =>
          this.billRepository.create({
            idPayment: savedPayment.id,
            idDocument: billDto.idDocument,
            idDocumentLink: billDto.idDocumentLink,
            montant: billDto.montant,
          }),
        );

        await queryRunner.manager.save(Bill, bills);
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedPayment.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: {
        bills: { document: true, documentLink: true },
        customer: true,
        paymentMethod: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: {
        bills: { document: true, documentLink: true },
        customer: true,
        paymentMethod: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Paiement non trouvé`);
    }

    return payment;
  }

  async findByCustomer(customerId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { idCustomer: customerId },
      relations: {
        bills: { document: true, documentLink: true },
        customer: true,
        paymentMethod: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await this.paymentRepository.findOne({
        where: { id },
        relations: { bills: true },
      });

      if (!payment) {
        throw new NotFoundException(`Paiement non trouvé`);
      }

      Object.assign(payment, {
        idCustomer: updatePaymentDto.idCustomer ?? payment.idCustomer,
        idPaymentMethod:
          updatePaymentDto.idPaymentMethod ?? payment.idPaymentMethod,
        ref: updatePaymentDto.ref ?? payment.ref,
        montant: updatePaymentDto.montant ?? payment.montant,
        date: updatePaymentDto.date ?? payment.date,
        dueDate: updatePaymentDto.dueDate ?? payment.dueDate,
        paymentDate: updatePaymentDto.paymentDate ?? payment.paymentDate,
      });

      await queryRunner.manager.save(Payment, payment);

      if (updatePaymentDto.bills) {
        await queryRunner.manager.delete(Bill, { idPayment: id });

        if (updatePaymentDto.bills.length > 0) {
          const bills = updatePaymentDto.bills.map((billDto) =>
            this.billRepository.create({
              idPayment: billDto.idPayment,
              idDocument: billDto.idDocument,
              idDocumentLink: billDto.idDocumentLink,
              montant: billDto.montant,
            }),
          );

          await queryRunner.manager.save(Bill, bills);
        }
      }

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new NotFoundException(`Paiement non trouvé`);
    }

    await this.paymentRepository.softDelete(id);
  }

  async restore(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!payment) {
      throw new NotFoundException(`Paiement non trouvé`);
    }

    if (!payment.deletedAt) {
      throw new BadRequestException(`Paiement non supprimé`);
    }

    await this.paymentRepository.restore(id);
    return this.findOne(id);
  }
}
