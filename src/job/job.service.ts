import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { JobEntity } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { plainToClass } from 'class-transformer';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobTenantDto } from './dto/create-job-tenant.dto';
import { CreateJobTenantResponseDto } from './dto/create-job-tenant-response.dto';
import { DeleteJobTenantDto } from './dto/delete-job-tenant.dto';
import { Tenant } from 'src/tenant/entities/tenant.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateJobDto): Promise<JobResponseDto> {
    try {
      // Vérification d'unicité
      const exists = await this.jobRepo.findOne({
        where: { title: dto.title.trim() },
      });
      if (exists) {
        throw new ConflictException(
          `Un métier avec le titre "${dto.title}" existe déjà`,
        );
      }

      // Création de l'entité
      const job = this.jobRepo.create({
        ...dto,
        title: dto.title.trim(),
      });

      // Sauvegarde
      const saved = await this.jobRepo.save(job);

      // Retour DTO
      return this.toDto(saved);
    } catch (error) {
      console.error('Erreur lors de la création du métier :', error);

      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la création du métier',
      );
    }
  }

  async findAll(): Promise<JobResponseDto[]> {
    const jobs = await this.jobRepo.find({
      relations: { tenants: true },
    });
    return jobs.map((job) => this.toDto(job));
  }

  async createJobTenant(
    dto: CreateJobTenantDto,
  ): Promise<CreateJobTenantResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { id: dto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Entreprise non trouvée');
      }

      const jobs = await queryRunner.manager.find(JobEntity, {
        where: { id: In(dto.jobIds) },
        relations: { tenants: true },
      });

      if (jobs.length !== dto.jobIds.length) {
        const foundJobIds = jobs.map((job) => job.id);
        const missingJobIds = dto.jobIds.filter(
          (id) => !foundJobIds.includes(id),
        );
        throw new NotFoundException(
          `Métiers non trouvés: ${missingJobIds.join(', ')}`,
        );
      }

      const updatedJobs: JobEntity[] = [];

      for (const job of jobs) {
        const existingRelation = job.tenants?.find(
          (t) => t.id === dto.tenantId,
        );
        if (existingRelation) {
          throw new ConflictException(
            `Le métier "${job.title}" est déjà affecté à cette entreprise`,
          );
        }

        if (!job.tenants) {
          job.tenants = [];
        }

        job.tenants.push(tenant);

        const savedJob = await queryRunner.manager.save(JobEntity, job);
        updatedJobs.push(savedJob);
      }

      await queryRunner.commitTransaction();

      const response: CreateJobTenantResponseDto = {
        success: true,
        message: `${updatedJobs.length} métier(s) affecté(s) avec succès à l'entreprise`,
        affectedJobs: updatedJobs.length,
        jobs: updatedJobs.map((job) => ({
          id: job.id,
          title: job.title,
          tenantsCount: job.tenants?.length || 0,
        })),
      };

      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteJobTenant(
    dto: DeleteJobTenantDto,
  ): Promise<CreateJobTenantResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { id: dto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Entreprise non trouvée');
      }

      const jobs = await queryRunner.manager.find(JobEntity, {
        where: { id: In(dto.jobIds) },
        relations: { tenants: true },
      });

      if (jobs.length !== dto.jobIds.length) {
        const foundJobIds = jobs.map((job) => job.id);
        const missingJobIds = dto.jobIds.filter(
          (id) => !foundJobIds.includes(id),
        );
        throw new NotFoundException(
          `Métiers non trouvés: ${missingJobIds.join(', ')}`,
        );
      }

      const updatedJobs: JobEntity[] = [];

      for (const job of jobs) {
        const existingRelation = job.tenants?.find(
          (t) => t.id === dto.tenantId,
        );
        if (!existingRelation) {
          throw new NotFoundException(
            `Le métier "${job.title}" n'est pas affecté à cette entreprise`,
          );
        }

        job.tenants = job.tenants.filter((t) => t.id !== dto.tenantId);

        const savedJob = await queryRunner.manager.save(JobEntity, job);
        updatedJobs.push(savedJob);
      }

      await queryRunner.commitTransaction();

      const response: CreateJobTenantResponseDto = {
        success: true,
        message: `${updatedJobs.length} métier(s) retiré(s) avec succès de l'entreprise`,
        affectedJobs: updatedJobs.length,
        jobs: updatedJobs.map((job) => ({
          id: job.id,
          title: job.title,
          tenantsCount: job.tenants?.length || 0,
        })),
      };

      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<JobResponseDto> {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: { tenants: true },
    });

    if (!job) {
      throw new NotFoundException('Métier non trouvé');
    }
    return this.toDto(job);
  }

  async update(id: string, dto: UpdateJobDto): Promise<JobResponseDto> {
    const job = await this.jobRepo.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException('Métier non trouvé');
    }

    if (dto.title && dto.title !== job.title) {
      const existing = await this.jobRepo.findOne({
        where: { title: dto.title },
      });
      if (existing) {
        throw new ConflictException('Un métier avec ce titre existe déjà');
      }
    }

    Object.assign(job, dto);
    const saved = await this.jobRepo.save(job);
    return this.toDto(saved);
  }

  async remove(id: string): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: { tenants: true },
    });
    if (!job) {
      throw new NotFoundException('Métier non trouvé');
    }

    await this.jobRepo.remove(job);
  }

  private toDto(entity: JobEntity): JobResponseDto {
    const dto = plainToClass(JobResponseDto, entity, {
      excludeExtraneousValues: true,
    });
    dto.tenantsCount = entity.tenants?.length || 0;
    dto.catalogsCount = 0;
    return dto;
  }
}
