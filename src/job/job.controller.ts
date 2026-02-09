import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobTenantResponseDto } from './dto/create-job-tenant-response.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateJobTenantDto } from './dto/create-job-tenant.dto';
import { ROLES, Roles, ALL_ROLES } from 'src/auth/role/roles.decorator';

@ApiTags('métiers')
@ApiBearerAuth()
@Controller('metiers')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un métier' })
  @ApiResponse({ status: 201, type: JobResponseDto })
  @Roles(...ALL_ROLES)
  async create(@Body() dto: CreateJobDto): Promise<JobResponseDto> {
    return this.jobService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les métiers' })
  @ApiResponse({ status: 200, type: [JobResponseDto] })
  @Roles(...ALL_ROLES)
  async findAll(): Promise<JobResponseDto[]> {
    return this.jobService.findAll();
  }

  @Post('tenant') 
  @ApiOperation({ summary: 'Affecter plusieurs métiers à un tenant' })
  @ApiResponse({ status: 201, type: CreateJobTenantResponseDto })
  @Roles(...ALL_ROLES)
  async createJobTenant(@Body() dto: CreateJobTenantDto): Promise<CreateJobTenantResponseDto> {
    return this.jobService.createJobTenant(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un métier par ID' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  @Roles(...ALL_ROLES)
  async findOne(@Param('id') id: string): Promise<JobResponseDto> {
    return this.jobService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un métier' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  @Roles(...ALL_ROLES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    return this.jobService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un métier' })
  @ApiResponse({ status: 204 })
  @Roles(...ALL_ROLES)
  async remove(@Param('id') id: string): Promise<void> {
    return this.jobService.remove(id);
  }
}