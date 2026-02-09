import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
  Request,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('address')
@Controller('address')
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle adresse' })
  @ApiResponse({
    status: 201,
    description: 'Adresse créée avec succès',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return await this.addressService.create(createAddressDto, req.user?.sub);
  }

  @Get('search/postal-code/:postalCode')
  @ApiOperation({ summary: 'Rechercher des adresses par code postal' })
  @ApiResponse({
    status: 200,
    description: 'Adresses trouvées',
    type: [AddressResponseDto],
  })
  async searchByPostalCode(
    @Param('postalCode') postalCode: string,
    @Query('tenantId') tenantId?: string,
  ): Promise<AddressResponseDto[]> {
    return await this.addressService.searchByPostalCode(postalCode, tenantId);
  }

  @Get('search/city/:cityId')
  @ApiOperation({ summary: 'Rechercher des adresses par ville' })
  @ApiResponse({
    status: 200,
    description: 'Adresses trouvées',
    type: [AddressResponseDto],
  })
  async searchByCity(
    @Param('cityId') cityId: string,
    @Query('tenantId') tenantId?: string,
  ): Promise<AddressResponseDto[]> {
    return await this.addressService.searchByCity(cityId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une adresse par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Adresse trouvée',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  async findOne(@Param('id') id: string): Promise<AddressResponseDto> {
    return await this.addressService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une adresse' })
  @ApiResponse({
    status: 200,
    description: 'Adresse mise à jour',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return await this.addressService.update(
      id,
      updateAddressDto,
      req.user?.sub,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une adresse' })
  @ApiResponse({ status: 204, description: 'Adresse supprimée' })
  @ApiResponse({ status: 404, description: 'Adresse non trouvée' })
  @ApiResponse({ status: 403, description: 'Adresse utilisée par une company' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return await this.addressService.remove(id, req.user?.sub);
  }
}
