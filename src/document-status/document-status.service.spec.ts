import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStatusService } from './document-status.service';

describe('DocumentStatusService', () => {
  let service: DocumentStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentStatusService],
    }).compile();

    service = module.get<DocumentStatusService>(DocumentStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
