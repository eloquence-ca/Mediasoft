import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('unités')
@ApiBearerAuth()
@Controller('unites')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle unité' })
  @ApiResponse({ status: 201, type: UnitResponseDto })
  async create(@Body() dto: CreateUnitDto): Promise<UnitResponseDto> {
    return await this.unitService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les unités' })
  @ApiResponse({ status: 200, type: [UnitResponseDto] })
  async findAll(): Promise<UnitResponseDto[]> {
    return await this.unitService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une unité par ID' })
  @ApiResponse({ status: 200, type: UnitResponseDto })
  @ApiResponse({ status: 404 })
  async findOne(@Param('id') id: string): Promise<UnitResponseDto> {
    return await this.unitService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une unité' })
  @ApiResponse({ status: 200, type: UnitResponseDto })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<UnitResponseDto> {
    return await this.unitService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une unité' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.unitService.remove(id);
  }
}
