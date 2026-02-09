import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Directory } from './entities/directory.entity';
import { CreateDirectoryDto } from './dto/create-directory.dto';
import { UpdateDirectoryDto } from './dto/update-directory.dto';
import { DirectoryCompany } from './entities/directory-company.entity';

@Injectable()
export class DirectoryService {
  constructor(
    @InjectRepository(Directory)
    private readonly directoryRepository: Repository<Directory>,
    @InjectRepository(DirectoryCompany)
    private readonly directoryCompanyRepository: Repository<DirectoryCompany>,
  ) {}

  async create(createDirectoryDto: CreateDirectoryDto): Promise<Directory> {
    const directory = this.directoryRepository.create(createDirectoryDto);
    return await this.directoryRepository.save(directory);
  }

  async findAll(): Promise<Directory[]> {
    return await this.directoryRepository.find({
      relations: ['tenant'],
      order: { name: 'ASC' },
    });
  }

  async findByCompany(companyId: string): Promise<DirectoryCompany[]> {
    const directoryCompanies = await this.directoryCompanyRepository.find({
      where: { idCompany: companyId },
      relations: { directory: true },
    });

    return directoryCompanies;
  }

  async findByTenant(tenantId: string): Promise<Directory[]> {
    return await this.directoryRepository.find({
      where: { idTenant: tenantId },
      relations: ['tenant', 'customers'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Directory> {
    const directory = await this.directoryRepository.findOne({
      where: { id },
      relations: ['tenant', 'customerNumbering', 'directoryCompanies'],
    });

    if (!directory) {
      throw new NotFoundException(`Directory with ID ${id} not found`);
    }

    return directory;
  }

  async getDirectoryCustomers(id: string) {
    const directory = await this.directoryRepository.findOne({
      where: { id },
      relations: [
        'customers',
        'customers.individual',
        'customers.professional',
        'customers.publicEntity',
      ],
    });

    if (!directory) {
      throw new NotFoundException(`Directory with ID ${id} not found`);
    }

    return directory.customers;
  }

  async update(
    id: string,
    updateDirectoryDto: UpdateDirectoryDto,
  ): Promise<Directory> {
    const directory = await this.findOne(id);
    Object.assign(directory, updateDirectoryDto);
    return await this.directoryRepository.save(directory);
  }

  async remove(id: string): Promise<void> {
    const directory = await this.findOne(id);
    await this.directoryRepository.remove(directory);
  }
}
