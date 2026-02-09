import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class AssignCompaniesToCatalogDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds: string[];
}

export class RemoveCompaniesFromCatalogDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds: string[];
}
