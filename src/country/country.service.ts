import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CountryResponseDto } from './dto/country-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async create(createCountryDto: CreateCountryDto): Promise<CountryResponseDto> {
    // Vérifier si le code pays existe déjà
    const existingCountry = await this.countryRepository.findOne({
      where: { code: createCountryDto.code }
    });

    if (existingCountry) {
      throw new ConflictException('Un pays avec ce code existe déjà');
    }

    // Vérifier si le nom existe déjà
    const existingName = await this.countryRepository.findOne({
      where: { name: createCountryDto.name }
    });

    if (existingName) {
      throw new ConflictException('Un pays avec ce nom existe déjà');
    }

    const country = this.countryRepository.create(createCountryDto);
    const savedCountry = await this.countryRepository.save(country);

    return this.mapToResponseDto(savedCountry);
  }

  async findAll(): Promise<CountryResponseDto[]> {
    const countries = await this.countryRepository.find({
      relations: ['cities'],
      order: { name: 'ASC' }
    });
    return countries.map(country => this.mapToResponseDto(country));
  }

  async findOne(id: string): Promise<CountryResponseDto> {
    const country = await this.countryRepository.findOne({
      where: { id },
      relations: ['cities']
    });

    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    return this.mapToResponseDto(country);
  }

  async findByCode(code: string): Promise<CountryResponseDto> {
    const country = await this.countryRepository.findOne({
      where: { code },
      relations: ['cities']
    });

    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    return this.mapToResponseDto(country);
  }

  async findByName(name: string): Promise<CountryResponseDto> {
    const country = await this.countryRepository.findOne({
      where: { name },
      relations: ['cities']
    });

    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    return this.mapToResponseDto(country);
  }

  async update(id: string, updateCountryDto: UpdateCountryDto): Promise<CountryResponseDto> {
    const country = await this.countryRepository.findOne({ where: { id } });
    
    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    // Vérifier les doublons si le code ou nom change
    if (updateCountryDto.code && updateCountryDto.code !== country.code) {
      const existingCode = await this.countryRepository.findOne({
        where: { code: updateCountryDto.code }
      });
      if (existingCode) {
        throw new ConflictException('Un pays avec ce code existe déjà');
      }
    }

    if (updateCountryDto.name && updateCountryDto.name !== country.name) {
      const existingName = await this.countryRepository.findOne({
        where: { name: updateCountryDto.name }
      });
      if (existingName) {
        throw new ConflictException('Un pays avec ce nom existe déjà');
      }
    }

    Object.assign(country, updateCountryDto);
    const savedCountry = await this.countryRepository.save(country);

    return this.mapToResponseDto(savedCountry);
  }

  async remove(id: string): Promise<void> {
    const country = await this.countryRepository.findOne({ 
      where: { id },
      relations: ['cities']
    });
    
    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    if (country.cities && country.cities.length > 0) {
      throw new ConflictException('Impossible de supprimer un pays qui contient des villes');
    }

    await this.countryRepository.remove(country);
  }

  async getCountryStats(id: string): Promise<any> {
    const country = await this.countryRepository.findOne({
      where: { id },
      relations: ['cities']
    });

    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    return {
      id: country.id,
      name: country.name,
      code: country.code,
      totalCities: country.cities?.length || 0,
      createdAt: country.createdAt,
    };
  }

  private mapToResponseDto(country: any): CountryResponseDto {
    const dto = plainToClass(CountryResponseDto, country);
    
    if (country.cities) {
      dto.citiesCount = country.cities.length;
    }

    return dto;
  }
}