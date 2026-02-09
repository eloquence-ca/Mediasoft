import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDirectoryDto {
  @IsUUID()
  idTenant: string;

  @IsString()
  @MaxLength(255)
  name: string;
}