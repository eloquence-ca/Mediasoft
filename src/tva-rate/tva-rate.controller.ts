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
import { TvaRateService } from './tva-rate.service';
import { CreateTvaRateDto } from './dto/create-tva-rate.dto';
import { UpdateTvaRateDto } from './dto/update-tva-rate.dto';

@Controller('tva-rates')
export class TvaRateController {
  constructor(private readonly tvaRateService: TvaRateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTvaRateDto: CreateTvaRateDto) {
    return this.tvaRateService.create(createTvaRateDto);
  }

  @Get()
  findAll() {
    return this.tvaRateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tvaRateService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTvaRateDto: UpdateTvaRateDto,
  ) {
    return this.tvaRateService.update(id, updateTvaRateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tvaRateService.remove(id);
  }
}