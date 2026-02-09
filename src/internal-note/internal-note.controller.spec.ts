import { Test, TestingModule } from '@nestjs/testing';
import { InternalNoteController } from './internal-note.controller';
import { InternalNoteService } from './internal-note.service';

describe('InternalNoteController', () => {
  let controller: InternalNoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalNoteController],
      providers: [InternalNoteService],
    }).compile();

    controller = module.get<InternalNoteController>(InternalNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
