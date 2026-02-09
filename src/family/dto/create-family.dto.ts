import { IsNotEmpty, IsString, IsOptional, IsUUID } from "class-validator";

export class CreateFamilyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  catalogId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
