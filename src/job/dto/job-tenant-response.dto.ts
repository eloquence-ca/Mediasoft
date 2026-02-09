import { Expose } from 'class-transformer';

export class JobTenantResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;
}