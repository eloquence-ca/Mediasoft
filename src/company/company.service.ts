import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { DirectoryCompany } from 'src/directory/entities/directory-company.entity';
import { Directory } from 'src/directory/entities/directory.entity';
import { DataSource, Repository } from 'typeorm';
import { UserCompany } from '../user/entities/user-company.entity';
import {
  AddDirectoryToCompanyDto,
  RemoveDirectoryFromCompanyDto,
} from './dto/company-directory.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(Directory)
    private readonly directoryRepository: Repository<Directory>,
    @InjectRepository(DirectoryCompany)
    private readonly directoryCompanyRepository: Repository<DirectoryCompany>,
    private readonly dataSource: DataSource,
  ) {}

  async findUserCompanies(userId: string): Promise<CompanyResponseDto[]> {
    const userCompanies = await this.userCompanyRepository.find({
      where: { idUser: userId },
      relations: ['company', 'company.tenant'],
    });

    const companies = userCompanies.map((uc) => uc.company);
    return companies.map((company) => this.mapToResponseDto(company));
  }

  private mapToResponseDto(company: any): CompanyResponseDto {
    const dto = plainToClass(CompanyResponseDto, company);

    if (company.userCompanies) {
      dto.usersCount = company.userCompanies.length;
      dto.adminsCount = company.userCompanies.filter((uc) => uc.isAdmin).length;
    }

    return dto;
  }

  async addDirectoryToCompany(
    companyId: string,
    addDirectoryDto: AddDirectoryToCompanyDto,
  ): Promise<DirectoryCompany> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      const directory = await this.directoryRepository.findOne({
        where: { id: addDirectoryDto.idDirectory },
      });

      if (!directory) {
        throw new NotFoundException(
          `Directory with ID ${addDirectoryDto.idDirectory} not found`,
        );
      }

      const existingRelation = await this.directoryCompanyRepository.findOne({
        where: {
          idCompany: companyId,
          idDirectory: addDirectoryDto.idDirectory,
        },
      });

      if (existingRelation) {
        throw new ConflictException(
          `Directory ${addDirectoryDto.idDirectory} is already associated with company ${companyId}`,
        );
      }

      if (addDirectoryDto.isDefault) {
        const existingDefault = await this.directoryCompanyRepository.findOne({
          where: {
            idCompany: companyId,
            isDefault: true,
          },
        });

        if (existingDefault) {
          await queryRunner.manager.update(
            DirectoryCompany,
            {
              idCompany: companyId,
              idDirectory: existingDefault.idDirectory,
            },
            { isDefault: false },
          );

          this.logger.log(
            `Removed default status from directory ${existingDefault.idDirectory} for company ${companyId}`,
          );
        }
      }

      const directoryCompany = this.directoryCompanyRepository.create({
        idCompany: companyId,
        idDirectory: addDirectoryDto.idDirectory,
        isDefault: addDirectoryDto.isDefault || false,
      });

      const savedRelation = await queryRunner.manager.save(directoryCompany);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully added directory ${addDirectoryDto.idDirectory} to company ${companyId}${
          addDirectoryDto.isDefault ? ' as default' : ''
        }`,
      );

      return savedRelation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to add directory ${addDirectoryDto.idDirectory} to company ${companyId}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeDirectoryFromCompany(
    companyId: string,
    removeDirectoryDto: RemoveDirectoryFromCompanyDto,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const directoryCompany = await this.directoryCompanyRepository.findOne({
        where: {
          idCompany: companyId,
          idDirectory: removeDirectoryDto.idDirectory,
        },
      });

      if (!directoryCompany) {
        throw new NotFoundException(
          `Directory ${removeDirectoryDto.idDirectory} is not associated with company ${companyId}`,
        );
      }

      const companyDirectoriesCount =
        await this.directoryCompanyRepository.count({
          where: { idCompany: companyId },
        });

      if (companyDirectoriesCount === 1) {
        throw new BadRequestException(
          `Cannot remove the last directory from company ${companyId}. A company must have at least one directory.`,
        );
      }

      if (directoryCompany.isDefault) {
        const anotherDirectory = await this.directoryCompanyRepository.findOne({
          where: {
            idCompany: companyId,
            idDirectory: { not: removeDirectoryDto.idDirectory } as any,
          },
          order: { idDirectory: 'ASC' },
        });

        if (anotherDirectory) {
          await queryRunner.manager.update(
            DirectoryCompany,
            {
              idCompany: companyId,
              idDirectory: anotherDirectory.idDirectory,
            },
            { isDefault: true },
          );

          this.logger.log(
            `Set directory ${anotherDirectory.idDirectory} as new default for company ${companyId}`,
          );
        }
      }

      await queryRunner.manager.delete(DirectoryCompany, {
        idCompany: companyId,
        idDirectory: removeDirectoryDto.idDirectory,
      });

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully removed directory ${removeDirectoryDto.idDirectory} from company ${companyId}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to remove directory ${removeDirectoryDto.idDirectory} from company ${companyId}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async setDefaultDirectory(
    companyId: string,
    directoryId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const directoryCompany = await this.directoryCompanyRepository.findOne({
        where: {
          idCompany: companyId,
          idDirectory: directoryId,
        },
      });

      if (!directoryCompany) {
        throw new NotFoundException(
          `Directory ${directoryId} is not associated with company ${companyId}`,
        );
      }

      if (directoryCompany.isDefault) {
        await queryRunner.rollbackTransaction();
        return;
      }

      await queryRunner.manager.update(
        DirectoryCompany,
        {
          idCompany: companyId,
          isDefault: true,
        },
        { isDefault: false },
      );

      await queryRunner.manager.update(
        DirectoryCompany,
        {
          idCompany: companyId,
          idDirectory: directoryId,
        },
        { isDefault: true },
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully set directory ${directoryId} as default for company ${companyId}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to set directory ${directoryId} as default for company ${companyId}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
