import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobEntity } from './entities/job.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity, Tenant])],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
