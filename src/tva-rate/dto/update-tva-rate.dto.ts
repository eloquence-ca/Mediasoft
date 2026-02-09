import { PartialType } from '@nestjs/swagger';
import { CreateTvaRateDto } from './create-tva-rate.dto';

export class UpdateTvaRateDto extends PartialType(CreateTvaRateDto) {}
