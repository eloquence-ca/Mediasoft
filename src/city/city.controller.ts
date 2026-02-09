import { Controller, Get, Param, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { CityResponseDto } from './dto/city-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('cities')
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les villes' })
  @ApiResponse({
    status: 200,
    description: 'Liste des villes',
    type: [CityResponseDto],
  })
  async findAll(
    @Query('countryId') countryId?: string,
  ): Promise<CityResponseDto[]> {
    if (countryId) {
      return await this.cityService.findByCountry(countryId);
    }
    return await this.cityService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des villes' })
  @ApiResponse({
    status: 200,
    description: 'Villes trouvées',
    type: [CityResponseDto],
  })
  async search(
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('countryId') countryId?: string,
  ): Promise<CityResponseDto[]> {
    if (name) {
      return await this.cityService.searchByName(name, countryId);
    }
    if (code) {
      return await this.cityService.findByCode(parseInt(code), countryId);
    }
    return await this.cityService.findAll();
  }

  @Get('country/:countryId')
  @ApiOperation({ summary: "Récupérer les villes d'un pays" })
  @ApiResponse({
    status: 200,
    description: 'Villes du pays',
    type: [CityResponseDto],
  })
  async findByCountry(
    @Param('countryId') countryId: string,
  ): Promise<CityResponseDto[]> {
    return await this.cityService.findByCountry(countryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une ville par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Ville trouvée',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ville non trouvée' })
  async findOne(@Param('id') id: string): Promise<CityResponseDto> {
    return await this.cityService.findOne(id);
  }
}
