import { Test, TestingModule } from '@nestjs/testing';
import { ArticleNatureController } from './article-nature.controller';
import { ArticleNatureService } from './article-nature.service';

describe('ArticleNatureController', () => {
  let controller: ArticleNatureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleNatureController],
      providers: [ArticleNatureService],
    }).compile();

    controller = module.get<ArticleNatureController>(ArticleNatureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
