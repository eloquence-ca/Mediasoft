import { Test, TestingModule } from '@nestjs/testing';
import { NumberingCustomerService } from './numbering-customer.service';

describe('NumberingService', () => {
  let service: NumberingCustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NumberingCustomerService],
    }).compile();

    service = module.get<NumberingCustomerService>(NumberingCustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
