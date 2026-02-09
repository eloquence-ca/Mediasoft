import { Test, TestingModule } from '@nestjs/testing';
import { NumberingController } from './numbering.controller';
import { NumberingCustomerService } from './numbering-customer.service';

describe('NumberingController', () => {
  let controller: NumberingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NumberingController],
      providers: [NumberingCustomerService],
    }).compile();

    controller = module.get<NumberingController>(NumberingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
