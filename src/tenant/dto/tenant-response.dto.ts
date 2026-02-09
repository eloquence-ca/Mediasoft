import { Expose } from 'class-transformer';
import { TenantStatus } from '../entities/tenant.entity';

export class TenantResponseDto {
  @Expose()
  id: string;

  @Expose()
  idCluster: string;

  @Expose()
  name: string;

  @Expose()
  domaine?: string;

  @Expose()
  maxNbrLicense: number;

  @Expose()
  status: TenantStatus;

  @Expose()
  startDateTrial?: Date;

  @Expose()
  endDateTrial?: Date;

  @Expose()
  activated: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  cluster?: any;

  @Expose()
  userTenants?: any[];
}
