import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateCatalogDto {
  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  jobs: string[];
}