import { Test, TestingModule } from '@nestjs/testing';
import { TvaRateController } from './tva-rate.controller';
import { TvaRateService } from './tva-rate.service';

describe('TvaRateController', () => {
  let controller: TvaRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TvaRateController],
      providers: [TvaRateService],
    }).compile();

    controller = module.get<TvaRateController>(TvaRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
