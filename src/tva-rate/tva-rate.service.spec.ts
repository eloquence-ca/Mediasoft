import { Test, TestingModule } from '@nestjs/testing';
import { TvaRateService } from './tva-rate.service';

describe('TvaRateService', () => {
  let service: TvaRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TvaRateService],
    }).compile();

    service = module.get<TvaRateService>(TvaRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
