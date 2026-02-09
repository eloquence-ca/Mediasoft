import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitEntity } from './entities/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
  ) {}

  async create(dto: CreateUnitDto): Promise<UnitResponseDto> {
    const exists = await this.unitRepo.findOne({ where: { code: dto.code } });

    if (exists) {
      throw new ConflictException('Une unité avec ce code existe déjà');
    }

    const unit = this.unitRepo.create(dto);
    const saved = await this.unitRepo.save(unit);

    return this.toDto(saved);
  }

  async findAll(): Promise<UnitResponseDto[]> {
    const units = await this.unitRepo.find({
      relations: ['saleArticles', 'purchaseArticles'],
    });
    return units.map((u) => this.toDto(u));
  }

  async findOne(id: string): Promise<UnitResponseDto> {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['saleArticles', 'purchaseArticles'],
    });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    return this.toDto(unit);
  }

  async update(id: string, dto: UpdateUnitDto): Promise<UnitResponseDto> {
    const unit = await this.unitRepo.findOne({ where: { id } });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    if (dto.code && dto.code !== unit.code) {
      const exists = await this.unitRepo.findOne({ where: { code: dto.code } });
      if (exists) {
        throw new ConflictException('Ce code est déjà utilisé');
      }
    }

    Object.assign(unit, dto);
    const saved = await this.unitRepo.save(unit);

    return this.toDto(saved);
  }

  async remove(id: string): Promise<void> {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['saleArticles', 'purchaseArticles'],
    });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    if ((unit.saleArticles?.length || 0) > 0 || (unit.purchaseArticles?.length || 0) > 0) {
      throw new ConflictException(
        'Impossible de supprimer cette unité car elle est utilisée par des articles',
      );
    }

    await this.unitRepo.remove(unit);
  }

  private toDto(unit: UnitEntity): UnitResponseDto {
    const dto = plainToInstance(UnitResponseDto, unit, { excludeExtraneousValues: true });
    dto.saleArticlesCount = unit.saleArticles?.length || 0;
    dto.purchaseArticlesCount = unit.purchaseArticles?.length || 0;
    return dto;
  }
}
