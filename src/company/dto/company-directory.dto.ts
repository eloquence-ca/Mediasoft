import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddDirectoryToCompanyDto {
  @IsUUID()
  idDirectory: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

export class RemoveDirectoryFromCompanyDto {
  @IsUUID()
  idDirectory: string;
}
