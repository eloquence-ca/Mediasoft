import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';

@ApiTags('tenant')
@Controller('tenant')
@ApiBearerAuth()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}
}
