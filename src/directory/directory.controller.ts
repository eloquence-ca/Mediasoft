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
import { DirectoryService } from './directory.service';
import { CreateDirectoryDto } from './dto/create-directory.dto';
import { UpdateDirectoryDto } from './dto/update-directory.dto';

@Controller('directories')
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDirectoryDto: CreateDirectoryDto) {
    return this.directoryService.create(createDirectoryDto);
  }

  @Get('tenant/:tenantId')
  findByTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.directoryService.findByTenant(tenantId);
  }

  @Get('company/:companyId')
  findByCompany(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.directoryService.findByCompany(companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.directoryService.findOne(id);
  }

  @Get(':id/customers')
  getDirectoryCustomers(@Param('id', ParseUUIDPipe) id: string) {
    return this.directoryService.getDirectoryCustomers(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDirectoryDto: UpdateDirectoryDto,
  ) {
    return this.directoryService.update(id, updateDirectoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.directoryService.remove(id);
  }
}
