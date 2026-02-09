import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConditionRegulation } from './entities/condition-regulation.entity';
import { CreateConditionRegulationDto } from './dto/create-condition-regulation.dto';
import { UpdateConditionRegulationDto } from './dto/update-condition-regulation.dto';

@Injectable()
export class ConditionRegulationService {
  constructor(
    @InjectRepository(ConditionRegulation)
    private readonly conditionRegulationRepository: Repository<ConditionRegulation>,
  ) {}

  async create(
    createConditionRegulationDto: CreateConditionRegulationDto,
  ): Promise<ConditionRegulation> {
    const existingCondition = await this.conditionRegulationRepository.findOne({
      where: { code: createConditionRegulationDto.code },
    });

    if (existingCondition) {
      throw new ConflictException('Ce code est déjà utilisé');
    }

    const conditionRegulation = this.conditionRegulationRepository.create(
      createConditionRegulationDto,
    );
    return await this.conditionRegulationRepository.save(conditionRegulation);
  }

  async findAll(): Promise<ConditionRegulation[]> {
    return await this.conditionRegulationRepository.find({
      order: { label: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ConditionRegulation> {
    const conditionRegulation =
      await this.conditionRegulationRepository.findOne({
        where: { id },
        relations: { customers: true },
      });

    if (!conditionRegulation) {
      throw new NotFoundException(`Condition de réglement non trouvé`);
    }

    return conditionRegulation;
  }

  async update(
    id: string,
    updateConditionRegulationDto: UpdateConditionRegulationDto,
  ): Promise<ConditionRegulation> {
    const conditionRegulation = await this.findOne(id);

    if (
      updateConditionRegulationDto.code &&
      updateConditionRegulationDto.code !== conditionRegulation.code
    ) {
      const existingCondition =
        await this.conditionRegulationRepository.findOne({
          where: { code: updateConditionRegulationDto.code },
        });

      if (existingCondition) {
        throw new ConflictException('Ce code est déjà utilisé');
      }
    }

    Object.assign(conditionRegulation, updateConditionRegulationDto);
    return await this.conditionRegulationRepository.save(conditionRegulation);
  }

  async remove(id: string): Promise<void> {
    const conditionRegulation = await this.findOne(id);

    if (
      conditionRegulation.customers &&
      conditionRegulation.customers.length > 0
    ) {
      throw new ConflictException(
        'Cette condition de reglement ne peux être supprimer car il est utilisé',
      );
    }

    await this.conditionRegulationRepository.softRemove(conditionRegulation);
  }
}
