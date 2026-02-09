import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { CreateNumberingDto } from './dto/create-numbering.dto';
import { UpdateNumberingDto } from './dto/update-numbering.dto';
import { NumberingCustomer } from './entities/numbering-customer.entity';

export enum DefaultFormats {
  CUSTOMER = 'CLI{COUNTER:4}',
}

@Injectable()
export class NumberingCustomerService {
  constructor(
    @InjectRepository(NumberingCustomer)
    private readonly numberingRepository: Repository<NumberingCustomer>,
  ) {}

  async create(
    createNumberingDto: CreateNumberingDto,
    query: QueryRunner,
  ): Promise<NumberingCustomer> {
    const numbering = this.numberingRepository.create({
      ...createNumberingDto,
      counter: 0,
    });

    return await query.manager.save(numbering);
  }

  async findAll(): Promise<NumberingCustomer[]> {
    return await this.numberingRepository.find({
      relations: { customerDirectory: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findCustomerByDirectory(
    directoryId: string,
  ): Promise<NumberingCustomer | null> {
    return await this.numberingRepository.findOne({
      where: { idCustomerDirectory: directoryId },
      relations: { customerDirectory: true },
    });
  }

  async findCustomerByDirectoryWithFail(
    directoryId: string,
  ): Promise<NumberingCustomer> {
    const numbering = await this.findCustomerByDirectory(directoryId);

    if (!numbering) {
      throw new NotFoundException(
        `Customer numbering for directory ${directoryId} not found`,
      );
    }

    return numbering;
  }

  async findOne(id: string): Promise<NumberingCustomer> {
    const numbering = await this.numberingRepository.findOne({
      where: { id },
      relations: { customerDirectory: true },
    });

    if (!numbering) {
      throw new NotFoundException(`Numbering with ID ${id} not found`);
    }

    return numbering;
  }

  async getNextNumber(
    id: string,
  ): Promise<{ nextNumber: string; formattedNumber: string }> {
    const numbering = await this.findOne(id);

    numbering.counter += 1;
    await this.numberingRepository.save(numbering);

    const formattedNumber = this.formatNumber(
      numbering.format,
      numbering.counter,
    );

    return {
      nextNumber: numbering.counter.toString(),
      formattedNumber,
    };
  }

  formatNumber(format: string, counter: number): string {
    const now = new Date();

    const variables: Record<string, string> = {
      '{YYYY}': now.getFullYear().toString(),
      '{YY}': now.getFullYear().toString().slice(-2),
      '{MM}': (now.getMonth() + 1).toString().padStart(2, '0'),
      '{DD}': now.getDate().toString().padStart(2, '0'),
      '{COUNTER}': counter.toString(),
      '{COUNTER:1}': counter.toString(),
      '{COUNTER:2}': counter.toString().padStart(2, '0'),
      '{COUNTER:3}': counter.toString().padStart(3, '0'),
      '{COUNTER:4}': counter.toString().padStart(4, '0'),
      '{COUNTER:5}': counter.toString().padStart(5, '0'),
      '{COUNTER:6}': counter.toString().padStart(6, '0'),
    };

    let formattedCode = format;

    Object.entries(variables).forEach(([placeholder, value]) => {
      formattedCode = formattedCode.replace(
        new RegExp(placeholder, 'g'),
        value,
      );
    });

    return formattedCode;
  }

  async update(
    id: string,
    updateNumberingDto: UpdateNumberingDto,
  ): Promise<NumberingCustomer> {
    const numbering = await this.findOne(id);
    Object.assign(numbering, updateNumberingDto);
    return await this.numberingRepository.save(numbering);
  }

  async remove(id: string): Promise<void> {
    const numbering = await this.findOne(id);
    await this.numberingRepository.remove(numbering);
  }

  async resetCounter(id: string): Promise<NumberingCustomer> {
    const numbering = await this.findOne(id);
    numbering.counter = 0;
    return await this.numberingRepository.save(numbering);
  }
}
