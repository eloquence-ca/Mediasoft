import { Test, TestingModule } from '@nestjs/testing';
import { InternalNoteService } from './internal-note.service';

describe('InternalNoteService', () => {
  let service: InternalNoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InternalNoteService],
    }).compile();

    service = module.get<InternalNoteService>(InternalNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
