import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBillMasterDto } from './dto/create-bill-master.dto';
import { UpdateBillMasterDto } from './dto/update-bill-master.dto';
import { Bill } from './entities/bill.entity';
import { Payment } from './entities/payment.entity';
import { UpsertDocumentBillDto } from './dto/upsert-document-bill.dto';
import { Document } from 'src/document/entities/document.entity';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(idDocument: string, idPayment: string): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { idDocument, idPayment },
      relations: {
        document: true,
        documentLink: true,
        payment: { customer: true, paymentMethod: true },
      },
    });

    if (!bill) {
      throw new NotFoundException(`Reglement non trouvé`);
    }

    return bill;
  }

  async findByDocument(documentId: string): Promise<Bill[]> {
    return this.billRepository.find({
      where: { idDocument: documentId },
      relations: {
        document: true,
        documentLink: true,
        payment: { customer: true, paymentMethod: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProject(idProject: string): Promise<Bill[]> {
    return this.billRepository.find({
      where: { idProject },
      relations: {
        document: true,
        documentLink: true,
        payment: { customer: true, paymentMethod: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateBillMasterDto): Promise<Bill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = this.paymentRepository.create({
        idCustomer: dto.idCustomer,
        idPaymentMethod: dto.idPaymentMethod,
        ref: dto.ref,
        montant: dto.montant,
        date: dto.date,
        dueDate: dto.dueDate,
        paymentDate: dto.paymentDate,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      const bills = this.billRepository.create({
        idPayment: savedPayment.id,
        idDocument: dto.idDocument,
        montant: dto.montant,
      });

      await queryRunner.manager.save(Bill, bills);

      await queryRunner.commitTransaction();

      return this.findOne(savedPayment.id, dto.idDocument);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(dto: UpdateBillMasterDto): Promise<Bill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: dto.idPayment },
      });

      if (!payment) {
        throw new NotFoundException('Paiement introuvable');
      }

      Object.assign(payment, {
        idCustomer: payment.idCustomer,
        idPaymentMethod: dto.idPaymentMethod,
        ref: dto.ref,
        montant: dto.montant,
        date: dto.date,
        dueDate: dto.dueDate,
        paymentDate: dto.paymentDate,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      const bill = await queryRunner.manager.findOne(Bill, {
        where: { idPayment: payment.id, idDocument: dto.idDocument },
      });

      if (!bill) {
        throw new NotFoundException('Règlement introuvable');
      }

      Object.assign(payment, {
        montant: dto.montant,
      });

      await queryRunner.manager.save(Bill, bill);

      await queryRunner.commitTransaction();

      return this.findOne(savedPayment.id, bill.idDocument);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async upsertDocumentBills(dto: UpsertDocumentBillDto): Promise<Bill[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const document = await queryRunner.manager.findOne(Document, {
        where: { id: dto.idDocument },
      });

      if (!document) {
        throw new NotFoundException(`Document introuvable`);
      }

      const existingBills = await queryRunner.manager.find(Bill, {
        where: { idDocument: dto.idDocument },
        relations: { payment: true },
      });

      const newBills = dto.bills?.filter((bill) => !bill.idPayment) || [];
      const billsToUpdate = dto.bills?.filter((bill) => bill.idPayment) || [];

      const updatedPaymentIds = new Set(
        billsToUpdate.map((bill) => bill.idPayment),
      );

      const billsToDelete = existingBills.filter(
        (bill) => !updatedPaymentIds.has(bill.idPayment),
      );

      for (const bill of billsToDelete) {
        await queryRunner.manager.delete(Bill, {
          idPayment: bill.idPayment,
          idDocument: dto.idDocument,
        });

        await queryRunner.manager.delete(Payment, { id: bill.idPayment });
      }

      for (const billDto of newBills) {
        const payment = queryRunner.manager.create(Payment, {
          idCustomer: billDto.idCustomer,
          idPaymentMethod: billDto.idPaymentMethod,
          ref: billDto.ref,
          montant: billDto.montant,
          date: billDto.date,
          dueDate: billDto.dueDate,
          paymentDate: billDto.paymentDate,
        });

        const savedPayment = await queryRunner.manager.save(Payment, payment);

        const bill = queryRunner.manager.create(Bill, {
          idPayment: savedPayment.id,
          idDocument: document.id,
          idProject: document.idProject,
          montant: billDto.montant,
        });

        await queryRunner.manager.save(Bill, bill);
      }

      for (const billDto of billsToUpdate) {
        const payment = await queryRunner.manager.findOne(Payment, {
          where: { id: billDto.idPayment },
        });

        if (!payment) {
          throw new NotFoundException(
            `Paiement ${billDto.idPayment} introuvable`,
          );
        }

        Object.assign(payment, {
          idPaymentMethod: billDto.idPaymentMethod,
          ref: billDto.ref,
          montant: billDto.montant,
          date: billDto.date,
          dueDate: billDto.dueDate,
          paymentDate: billDto.paymentDate,
        });

        await queryRunner.manager.save(Payment, payment);

        const bill = await queryRunner.manager.findOne(Bill, {
          where: { idPayment: billDto.idPayment, idDocument: dto.idDocument },
        });

        if (bill) {
          bill.montant = billDto.montant;
          await queryRunner.manager.save(Bill, bill);
        }
      }

      await queryRunner.commitTransaction();

      return this.findByDocument(dto.idDocument);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
