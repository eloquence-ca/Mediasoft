import { IsNotEmpty, IsString, IsArray, IsUUID } from 'class-validator';

export class DeleteJobTenantDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  tenantId: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  jobIds: string[];
} 