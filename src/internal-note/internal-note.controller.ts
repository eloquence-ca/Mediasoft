import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InternalNoteService } from './internal-note.service';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';

@Controller('internal-notes')
export class InternalNoteController {
  constructor(private readonly internalNoteService: InternalNoteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createInternalNoteDto: CreateInternalNoteDto) {
    return this.internalNoteService.create(createInternalNoteDto);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.internalNoteService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.internalNoteService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInternalNoteDto: UpdateInternalNoteDto,
  ) {
    return this.internalNoteService.update(id, updateInternalNoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.internalNoteService.remove(id);
  }
}