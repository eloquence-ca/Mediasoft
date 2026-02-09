import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateJobTenantDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  jobId: string;
}