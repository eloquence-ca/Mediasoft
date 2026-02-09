import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';

export const enum PAYMENT_METHOD {
  CHEQUE = 'CHEQUE',
  CARTE_BLEUE = 'CARTE_BLEUE',
  ESPECE = 'ESPECE',
  PRELEVEMENT = 'PRELEVEMENT',
}

@Injectable()
export class PaymentMethodService implements OnModuleInit {
  private readonly logger = new Logger(PaymentMethodService.name);

  constructor(
    @InjectRepository(PaymentMethod)
    private readonly repo: Repository<PaymentMethod>,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing payment method...');

    try {
      await this.initialize();
      this.logger.log('Payment method initialization completed successfully');
    } catch (error) {
      this.logger.error('Failed to initialize payment method', error);
    }
  }

  async initialize(): Promise<void> {
    const items = [
      {
        code: PAYMENT_METHOD.CHEQUE,
        label: 'Chèque',
      },
      {
        code: PAYMENT_METHOD.CARTE_BLEUE,
        label: 'Carte bleue',
      },
      {
        code: PAYMENT_METHOD.ESPECE,
        label: 'Espèces',
      },
      {
        code: PAYMENT_METHOD.PRELEVEMENT,
        label: 'Prélèvement',
      },
    ];

    for (const item of items) {
      const existingMethod = await this.repo.findOne({
        where: { code: item.code },
      });

      if (!existingMethod) {
        const method = this.repo.create(item);
        await this.repo.save(method);
        this.logger.log(`Payment method ${item.code} created`);
      }
    }
  }

  findAll() {
    return this.repo.find();
  }
}
