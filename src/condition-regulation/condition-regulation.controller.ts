import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConditionRegulationService } from './condition-regulation.service';
import { CreateConditionRegulationDto } from './dto/create-condition-regulation.dto';
import { UpdateConditionRegulationDto } from './dto/update-condition-regulation.dto';

@Controller('condition-regulations')
export class ConditionRegulationController {
  constructor(private readonly conditionRegulationService: ConditionRegulationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createConditionRegulationDto: CreateConditionRegulationDto) {
    return this.conditionRegulationService.create(createConditionRegulationDto);
  }

  @Get()
  findAll() {
    return this.conditionRegulationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.conditionRegulationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateConditionRegulationDto: UpdateConditionRegulationDto,
  ) {
    return this.conditionRegulationService.update(id, updateConditionRegulationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.conditionRegulationService.remove(id);
  }
}