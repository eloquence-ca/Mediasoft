import { Expose } from 'class-transformer';

export class CreateJobTenantResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  affectedJobs: number;

  @Expose()
  jobs: {
    id: string;
    title: string;
    tenantsCount: number;
  }[];
} 