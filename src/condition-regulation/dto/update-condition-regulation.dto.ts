import { PartialType } from '@nestjs/swagger';
import { CreateConditionRegulationDto } from './create-condition-regulation.dto';

export class UpdateConditionRegulationDto extends PartialType(CreateConditionRegulationDto) {}
