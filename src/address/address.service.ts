import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(
    createAddressDto: CreateAddressDto,
    createdByUserId?: string,
  ): Promise<AddressResponseDto> {
    const address = this.addressRepository.create(createAddressDto);
    const savedAddress = await this.addressRepository.save(address);

    return this.mapToResponseDto(savedAddress);
  }

  async findAll(): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.find({
      relations: { city: { country: true } },
      order: { label: 'ASC' },
    });
    return addresses.map((address) => this.mapToResponseDto(address));
  }

  async findOne(id: string): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: { city: { country: true } },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    return this.mapToResponseDto(address);
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
    updatedByUserId?: string,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findOne({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    Object.assign(address, updateAddressDto);
    const savedAddress = await this.addressRepository.save(address);

    return this.mapToResponseDto(savedAddress);
  }

  async remove(id: string, deletedByUserId?: string): Promise<void> {
    const address = await this.addressRepository.findOne({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    await this.addressRepository.remove(address);
  }

  async searchByPostalCode(
    postalCode: string,
    tenantId?: string,
  ): Promise<AddressResponseDto[]> {
    const where: any = { postalCode };
    if (tenantId) {
      where.idTenant = tenantId;
    }

    const addresses = await this.addressRepository.find({
      where,
      relations: ['tenant', 'city', 'city.country'],
      order: { label: 'ASC' },
    });

    return addresses.map((address) => this.mapToResponseDto(address));
  }

  async searchByCity(
    cityId: string,
    tenantId?: string,
  ): Promise<AddressResponseDto[]> {
    const where: any = { idCity: cityId };
    if (tenantId) {
      where.idTenant = tenantId;
    }

    const addresses = await this.addressRepository.find({
      where,
      relations: { city: { country: true } },
      order: { label: 'ASC' },
    });

    return addresses.map((address) => this.mapToResponseDto(address));
  }

  private async validateUserTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    // Cette méthode devrait vérifier que l'utilisateur appartient au tenant
    // Vous devrez implémenter cette logique selon votre système
    // Pour l'instant, on fait confiance au paramètre
  }

  private mapToResponseDto(address: any): AddressResponseDto {
    const dto = plainToClass(AddressResponseDto, address);

    // Construire l'adresse complète
    let fullAddress = '';
    if (address.trackNum) fullAddress += `${address.trackNum} `;
    if (address.trackName) fullAddress += `${address.trackName} `;
    if (address.complement) fullAddress += `${address.complement} `;
    if (address.postalCode) fullAddress += `${address.postalCode} `;
    if (address.city?.name) fullAddress += address.city.name;

    dto.fullAddress = fullAddress.trim();

    return dto;
  }
}
