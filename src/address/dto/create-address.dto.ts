import { PartialType } from '@nestjs/swagger';
import { AddressDto } from './address.dto';

export class CreateAddressDto extends PartialType(AddressDto) {}
