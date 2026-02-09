import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { City } from './entities/city.entity';
import { Country } from '../country/entities/country.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CityResponseDto } from './dto/city-response.dto';
import { plainToClass } from 'class-transformer';
import { BulkCreateCitiesDto } from './dto/bulk-create-cities.dto';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCityDto: CreateCityDto): Promise<CityResponseDto> {
    // Vérifier si le pays existe
    const country = await this.countryRepository.findOne({
      where: { id: createCityDto.idCountry },
    });

    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    // Vérifier si une ville avec ce code existe déjà dans ce pays
    const existingCity = await this.cityRepository.findOne({
      where: {
        code: createCityDto.code,
        idCountry: createCityDto.idCountry,
      },
    });

    if (existingCity) {
      throw new ConflictException(
        'Une ville avec ce code existe déjà dans ce pays',
      );
    }

    const city = this.cityRepository.create(createCityDto);
    const savedCity = await this.cityRepository.save(city);

    return this.mapToResponseDto(savedCity);
  }

  async findAll(): Promise<CityResponseDto[]> {
    const cities = await this.cityRepository.find({
      relations: ['country'],
      order: { name: 'ASC' },
    });
    return cities.map((city) => this.mapToResponseDto(city));
  }

  async findByCountry(countryId: string): Promise<CityResponseDto[]> {
    const cities = await this.cityRepository.find({
      where: { idCountry: countryId },
      relations: ['country'],
      order: { name: 'ASC' },
    });
    return cities.map((city) => this.mapToResponseDto(city));
  }

  async findByCode(
    code: number,
    countryId?: string,
  ): Promise<CityResponseDto[]> {
    const where: any = { code };
    if (countryId) {
      where.idCountry = countryId;
    }

    const cities = await this.cityRepository.find({
      where,
      relations: ['country'],
      order: { name: 'ASC' },
    });

    return cities.map((city) => this.mapToResponseDto(city));
  }

  async searchByName(
    name: string,
    countryId?: string,
  ): Promise<CityResponseDto[]> {
    const queryBuilder = this.cityRepository
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.country', 'country')
      .where('LOWER(city.name) LIKE LOWER(:name)', { name: `%${name}%` });

    if (countryId) {
      queryBuilder.andWhere('city.idCountry = :countryId', { countryId });
    }

    const cities = await queryBuilder.orderBy('city.name', 'ASC').getMany();

    return cities.map((city) => this.mapToResponseDto(city));
  }

  async findOne(id: string): Promise<CityResponseDto> {
    const city = await this.cityRepository.findOne({
      where: { id },
      relations: ['country'],
    });

    if (!city) {
      throw new NotFoundException('Ville non trouvée');
    }

    return this.mapToResponseDto(city);
  }

  async update(
    id: string,
    updateCityDto: UpdateCityDto,
  ): Promise<CityResponseDto> {
    const city = await this.cityRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException('Ville non trouvée');
    }

    // Si le pays change, vérifier qu'il existe
    if (updateCityDto.idCountry && updateCityDto.idCountry !== city.idCountry) {
      const country = await this.countryRepository.findOne({
        where: { id: updateCityDto.idCountry },
      });
      if (!country) {
        throw new NotFoundException('Nouveau pays non trouvé');
      }
    }

    // Vérifier les doublons de code dans le pays
    if (updateCityDto.code && updateCityDto.code !== city.code) {
      const existingCity = await this.cityRepository.findOne({
        where: {
          code: updateCityDto.code,
          idCountry: updateCityDto.idCountry || city.idCountry,
        },
      });
      if (existingCity) {
        throw new ConflictException(
          'Une ville avec ce code existe déjà dans ce pays',
        );
      }
    }

    Object.assign(city, updateCityDto);
    const savedCity = await this.cityRepository.save(city);

    return this.mapToResponseDto(savedCity);
  }

  async remove(id: string): Promise<void> {
    const city = await this.cityRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException('Ville non trouvée');
    }

    await this.cityRepository.remove(city);
  }

  async importFrenchCities(): Promise<{ imported: number; errors: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Créer ou récupérer le pays France
      let france = await this.countryRepository.findOne({
        where: { code: '250' }, // Code ISO 3166-1 numérique pour la France
      });

      if (!france) {
        france = this.countryRepository.create({
          name: 'France',
          code: '250',
        });
        france = await queryRunner.manager.save(Country, france);
      }

      // 2. Charger les données des villes françaises
      const frenchCities = this.getFrenchCitiesData();

      let imported = 0;
      let errors = 0;

      // 3. Importer les villes par batch
      const batchSize = 1000;
      for (let i = 0; i < frenchCities.length; i += batchSize) {
        const batch = frenchCities.slice(i, i + batchSize);

        for (const cityData of batch) {
          try {
            // Vérifier si la ville existe déjà
            const existingCity = await queryRunner.manager.findOne(City, {
              where: {
                code: cityData.code,
                idCountry: france.id,
              },
            });

            if (!existingCity) {
              const city = queryRunner.manager.create(City, {
                idCountry: france.id,
                name: cityData.name,
                code: cityData.code,
              });
              await queryRunner.manager.save(City, city);
              imported++;
            }
          } catch (error) {
            console.error(`Erreur import ville ${cityData.name}:`, error);
            errors++;
          }
        }
      }

      await queryRunner.commitTransaction();
      return { imported, errors };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreateCities(
    countryId: string,
    bulkCreateDto: BulkCreateCitiesDto,
  ): Promise<{ imported: number; errors: number }> {
    // Vérifier si le pays existe
    const country = await this.countryRepository.findOne({
      where: { id: countryId },
    });

    if (!country) {
      throw new NotFoundException('Pays non trouvé');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let imported = 0;
      let errors = 0;

      for (const cityData of bulkCreateDto.cities) {
        try {
          // Vérifier si la ville existe déjà
          const existingCity = await queryRunner.manager.findOne(City, {
            where: {
              code: cityData.code,
              idCountry: countryId,
            },
          });

          if (!existingCity) {
            const city = queryRunner.manager.create(City, {
              idCountry: countryId,
              name: cityData.name,
              code: cityData.code,
            });
            await queryRunner.manager.save(City, city);
            imported++;
          }
        } catch {
          errors++;
        }
      }

      await queryRunner.commitTransaction();
      return { imported, errors };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getFrenchCitiesData(): Array<{ name: string; code: string }> {
    // Données des principales villes françaises avec codes postaux
    // En production, vous pourriez charger cela depuis un fichier JSON ou une API
    return [
      // Région Île-de-France
      { name: 'Paris 1er Arrondissement', code: '75001' },
      { name: 'Paris 2e Arrondissement', code: '75002' },
      { name: 'Paris 3e Arrondissement', code: '75003' },
      { name: 'Paris 4e Arrondissement', code: '75004' },
      { name: 'Paris 5e Arrondissement', code: '75005' },
      { name: 'Paris 6e Arrondissement', code: '75006' },
      { name: 'Paris 7e Arrondissement', code: '75007' },
      { name: 'Paris 8e Arrondissement', code: '75008' },
      { name: 'Paris 9e Arrondissement', code: '75009' },
      { name: 'Paris 10e Arrondissement', code: '75010' },
      { name: 'Paris 11e Arrondissement', code: '75011' },
      { name: 'Paris 12e Arrondissement', code: '75012' },
      { name: 'Paris 13e Arrondissement', code: '75013' },
      { name: 'Paris 14e Arrondissement', code: '75014' },
      { name: 'Paris 15e Arrondissement', code: '75015' },
      { name: 'Paris 16e Arrondissement', code: '75016' },
      { name: 'Paris 17e Arrondissement', code: '75017' },
      { name: 'Paris 18e Arrondissement', code: '75018' },
      { name: 'Paris 19e Arrondissement', code: '75019' },
      { name: 'Paris 20e Arrondissement', code: '75020' },

      // Grandes villes
      { name: 'Marseille', code: '13000' },
      { name: 'Lyon', code: '69000' },
      { name: 'Toulouse', code: '31000' },
      { name: 'Nice', code: '6000' },
      { name: 'Nantes', code: '44000' },
      { name: 'Montpellier', code: '34000' },
      { name: 'Strasbourg', code: '67000' },
      { name: 'Bordeaux', code: '33000' },
      { name: 'Lille', code: '59000' },
      { name: 'Rennes', code: '35000' },
      { name: 'Reims', code: '51100' },
      { name: 'Toulon', code: '83000' },
      { name: 'Saint-Étienne', code: '42000' },
      { name: 'Le Havre', code: '76600' },
      { name: 'Grenoble', code: '38000' },
      { name: 'Dijon', code: '21000' },
      { name: 'Angers', code: '49000' },
      { name: 'Nîmes', code: '30000' },
      { name: 'Villeurbanne', code: '69100' },
      { name: 'Aix-en-Provence', code: '13100' },
      { name: 'Brest', code: '29200' },
      { name: 'Limoges', code: '87000' },
      { name: 'Tours', code: '37000' },
      { name: 'Amiens', code: '80000' },
      { name: 'Perpignan', code: '66000' },
      { name: 'Metz', code: '57000' },
      { name: 'Besançon', code: '25000' },
      { name: 'Orléans', code: '45000' },
      { name: 'Rouen', code: '76000' },
      { name: 'Mulhouse', code: '68100' },
      { name: 'Caen', code: '14000' },
      { name: 'Nancy', code: '54000' },
    ];
  }

  private mapToResponseDto(city: any): CityResponseDto {
    return plainToClass(CityResponseDto, city);
  }
}
