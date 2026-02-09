import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressClone } from './entities/address-clone.entity';
import { AddressCloneResponseDto } from './dto/address-clone-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class AddressCloneService {
  constructor(
    @InjectRepository(AddressClone)
    private readonly addressRepository: Repository<AddressClone>,
  ) {}

  async findAll(): Promise<AddressCloneResponseDto[]> {
    const addresses = await this.addressRepository.find({
      relations: { city: { country: true } },
      order: { label: 'ASC' },
    });
    return addresses.map((address) => this.mapToResponseDto(address));
  }

  async findOne(id: string): Promise<AddressCloneResponseDto> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: { city: { country: true } },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    return this.mapToResponseDto(address);
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
  ): Promise<AddressCloneResponseDto[]> {
    const where: any = { postalCode };
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

  async searchByCity(
    cityId: string,
    tenantId?: string,
  ): Promise<AddressCloneResponseDto[]> {
    const where: any = { idCity: cityId };
    if (tenantId) {
      where.idTenant = tenantId;
    }

    const addresses = await this.addressRepository.find({
      where,
      relations: {  city: { country: true } },
      order: { label: 'ASC' },
    });

    return addresses.map((address) => this.mapToResponseDto(address));
  }

  private mapToResponseDto(address: any): AddressCloneResponseDto {
    const dto = plainToClass(AddressCloneResponseDto, address);

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
