import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { UpdateNumberingDto } from './dto/update-numbering.dto';
import { NumberingCustomerService } from './numbering-customer.service';

@Controller('numberings')
export class NumberingController {
  constructor(private readonly numberingService: NumberingCustomerService) {}

  @Get('directory/:directoryId/customer')
  findCustomerByDirectory(
    @Param('directoryId', ParseUUIDPipe) directoryId: string,
  ) {
    return this.numberingService.findCustomerByDirectoryWithFail(directoryId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.numberingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNumberingDto: UpdateNumberingDto,
  ) {
    return this.numberingService.update(id, updateNumberingDto);
  }
}
