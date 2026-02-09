import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryController } from './directory.controller';
import { DirectoryService } from './directory.service';

describe('DirectoryController', () => {
  let controller: DirectoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryController],
      providers: [DirectoryService],
    }).compile();

    controller = module.get<DirectoryController>(DirectoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
