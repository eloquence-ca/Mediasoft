import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodService } from './payment-method.service';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { Bill } from './entities/bill.entity';
import { BillService } from './bill.service';
import { UpsertDocumentBillDto } from './dto/upsert-document-bill.dto';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly billService: BillService,
    private readonly paymentMethodService: PaymentMethodService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.create(createPaymentDto);
  }

  @Get('methods')
  @ApiOperation({
    summary: 'Récupérer toutes les methodes de paiement',
    description: 'Récupère toutes les methodes de paiement',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des methodes de paiement',
    type: PaymentMethod,
  })
  findAllMethod() {
    return this.paymentMethodService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return this.paymentService.findOne(id);
  }

  @Get('bills-by-document/:documentId')
  async findByDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<Bill[]> {
    return this.billService.findByDocument(documentId);
  }

  @Post('upsert-document-bills')
  async UpsertDocumentBill(
    @Body() dto: UpsertDocumentBillDto,
  ): Promise<Bill[]> {
    return this.billService.upsertDocumentBills(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.paymentService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return this.paymentService.restore(id);
  }
}
