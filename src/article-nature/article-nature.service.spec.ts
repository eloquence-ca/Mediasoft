import { Test, TestingModule } from '@nestjs/testing';
import { ArticleNatureService } from './article-nature.service';

describe('ArticleNatureService', () => {
  let service: ArticleNatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleNatureService],
    }).compile();

    service = module.get<ArticleNatureService>(ArticleNatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
