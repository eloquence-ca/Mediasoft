import { PartialType } from '@nestjs/swagger';
import { CreateBillMasterDto } from './create-bill-master.dto';

export class UpdateBillMasterDto extends PartialType(CreateBillMasterDto) {}
