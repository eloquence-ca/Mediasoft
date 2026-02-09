import { Test, TestingModule } from '@nestjs/testing';
import { ConditionRegulationService } from './condition-regulation.service';

describe('ConditionRegulationService', () => {
  let service: ConditionRegulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConditionRegulationService],
    }).compile();

    service = module.get<ConditionRegulationService>(ConditionRegulationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
