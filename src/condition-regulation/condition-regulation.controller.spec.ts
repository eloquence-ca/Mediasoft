import { Test, TestingModule } from '@nestjs/testing';
import { ConditionRegulationController } from './condition-regulation.controller';
import { ConditionRegulationService } from './condition-regulation.service';

describe('ConditionRegulationController', () => {
  let controller: ConditionRegulationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConditionRegulationController],
      providers: [ConditionRegulationService],
    }).compile();

    controller = module.get<ConditionRegulationController>(ConditionRegulationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
