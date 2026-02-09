import { Controller, Get, Param } from '@nestjs/common';
import { CountryService } from './country.service';
import { CountryResponseDto } from './dto/country-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('country')
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les pays' })
  @ApiResponse({
    status: 200,
    description: 'Liste des pays',
    type: [CountryResponseDto],
  })
  async findAll(): Promise<CountryResponseDto[]> {
    return await this.countryService.findAll();
  }

  @Get('search/code/:code')
  @ApiOperation({ summary: 'Rechercher un pays par code' })
  @ApiResponse({
    status: 200,
    description: 'Pays trouvé',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pays non trouvé' })
  async findByCode(@Param('code') code: string): Promise<CountryResponseDto> {
    return await this.countryService.findByCode(code);
  }

  @Get('search/name/:name')
  @ApiOperation({ summary: 'Rechercher un pays par nom' })
  @ApiResponse({
    status: 200,
    description: 'Pays trouvé',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pays non trouvé' })
  async findByName(@Param('name') name: string): Promise<CountryResponseDto> {
    return await this.countryService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un pays par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Pays trouvé',
    type: CountryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pays non trouvé' })
  async findOne(@Param('id') id: string): Promise<CountryResponseDto> {
    return await this.countryService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: "Récupérer les statistiques d'un pays" })
  @ApiResponse({ status: 200, description: 'Statistiques du pays' })
  @ApiResponse({ status: 404, description: 'Pays non trouvé' })
  async getCountryStats(@Param('id') id: string): Promise<any> {
    return await this.countryService.getCountryStats(id);
  }
}
