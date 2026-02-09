import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
  IsUUID,
} from 'class-validator';
import { CIVILITY } from 'src/user/enum';

export class ContactDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MaxLength(255)
  firstname: string;

  @IsString()
  @MaxLength(255)
  lastname: string;

  @IsOptional()
  @IsEnum(CIVILITY)
  civility?: CIVILITY;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cellPhone?: string;

  @IsBoolean()
  quoteRecipient: boolean;

  @IsBoolean()
  invoiceRecipient: boolean;
}
