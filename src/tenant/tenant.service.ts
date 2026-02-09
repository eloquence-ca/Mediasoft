import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { Tenant } from './entities/tenant.entity';
import { NIL } from 'src/common/constants';

@Injectable()
export class TenantService implements OnModuleInit {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  onModuleInit() {
    this.createNIL();
  }

  private async createNIL() {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: NIL },
      });

      if (!tenant) {
        const tenant = new Tenant();
        tenant.id = NIL;
        tenant.name = NIL;
        tenant.domaine = NIL;

        await this.tenantRepository.save(tenant);

        this.logger.log(`Create NIL Tenant`);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant non trouvé');
    }

    return plainToInstance(TenantResponseDto, tenant);
  }
}
