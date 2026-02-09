import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStatusController } from './document-status.controller';
import { DocumentStatusService } from './document-status.service';

describe('DocumentStatusController', () => {
  let controller: DocumentStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentStatusController],
      providers: [DocumentStatusService],
    }).compile();

    controller = module.get<DocumentStatusController>(DocumentStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
