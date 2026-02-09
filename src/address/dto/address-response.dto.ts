import { Expose } from 'class-transformer';

export class AddressResponseDto {
  @Expose()
  id: string;

  @Expose()
  idCity?: string;

  @Expose()
  label: string;

  @Expose()
  trackNum?: number;

  @Expose()
  trackName?: string;

  @Expose()
  complement?: string;

  @Expose()
  postalCode?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  tenant?: any;

  @Expose()
  city?: any;

  @Expose()
  fullAddress?: string;
}
