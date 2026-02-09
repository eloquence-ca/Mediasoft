import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class FamilyLayerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  catalogId: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
