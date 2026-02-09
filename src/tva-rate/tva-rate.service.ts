import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TvaRate } from './entities/tva-rate.entity';
import { CreateTvaRateDto } from './dto/create-tva-rate.dto';
import { UpdateTvaRateDto } from './dto/update-tva-rate.dto';

@Injectable()
export class TvaRateService {
  constructor(
    @InjectRepository(TvaRate)
    private readonly tvaRateRepository: Repository<TvaRate>,
  ) {}

  async create(createTvaRateDto: CreateTvaRateDto): Promise<TvaRate> {
    const existingTvaRate = await this.tvaRateRepository.findOne({
      where: { code: createTvaRateDto.code },
    });

    if (existingTvaRate) {
      throw new ConflictException('Ce code est déjà utilisé');
    }

    const tvaRate = this.tvaRateRepository.create(createTvaRateDto);
    return await this.tvaRateRepository.save(tvaRate);
  }

  async findAll(): Promise<TvaRate[]> {
    return await this.tvaRateRepository.find({
      order: { rate: 'ASC' },
      where: { isDeleted: false },
    });
  }

  async findOne(id: string): Promise<TvaRate> {
    const tvaRate = await this.tvaRateRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!tvaRate) {
      throw new NotFoundException(`Taux `);
    }

    return tvaRate;
  }

  async update(
    id: string,
    updateTvaRateDto: UpdateTvaRateDto,
  ): Promise<TvaRate> {
    const tvaRate = await this.findOne(id);

    if (updateTvaRateDto.code && updateTvaRateDto.code !== tvaRate.code) {
      const existingTvaRate = await this.tvaRateRepository.findOne({
        where: { code: updateTvaRateDto.code },
      });

      if (existingTvaRate) {
        throw new ConflictException("Le taux de TVA n'as pas été trouvé.");
      }
    }

    Object.assign(tvaRate, updateTvaRateDto);
    return await this.tvaRateRepository.save(tvaRate);
  }

  async remove(id: string): Promise<void> {
    const tvaRate = await this.findOne(id);

    if (tvaRate.customers && tvaRate.customers.length > 0) {
      throw new ConflictException(
        'Ce taux de TVA ne peux être supprimer car il est utilisé',
      );
    }

    tvaRate.isDeleted = true;
    tvaRate.code = `${tvaRate.code}-${Date.now()}`;
    await this.tvaRateRepository.save(tvaRate);
  }
}
