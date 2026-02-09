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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, TYPE_CUSTOMER } from './entities/customer.entity';
import { CreateCompleteCustomerDto } from './dto/create-complete-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.CREATED)
  createComplete(@Body() createCompleteCustomerDto: CreateCompleteCustomerDto) {
    return this.customerService.create(createCompleteCustomerDto);
  }

  @Get('company/:companyId')
  async findCustomersByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<Customer[]> {
    return await this.customerService.findCustomersByCompanyId(companyId);
  }

  @Get('directory/:directoryId')
  findByDirectory(@Param('directoryId', ParseUUIDPipe) directoryId: string) {
    return this.customerService.findByDirectory(directoryId);
  }

  @Get('type/:type')
  findByType(@Param('type') type: TYPE_CUSTOMER) {
    return this.customerService.findByType(type);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findOne(id);
  }

  @Get(':id/with-details')
  findOneWithDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findOneWithDetails(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: CreateCompleteCustomerDto,
  ) {
    return this.customerService.updateCompleteCustomer(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.remove(id);
  }

  @Get(':id/contacts')
  getCustomerContacts(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getCustomerContacts(id);
  }

  @Get(':id/internal-notes')
  getCustomerNotes(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getCustomerNotes(id);
  }

  @Get(':id/addresses')
  getCustomerAddresses(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getCustomerAddresses(id);
  }
}
