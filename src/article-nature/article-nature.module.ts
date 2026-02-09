import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleNatureService } from './article-nature.service';
import { ArticleNatureController } from './article-nature.controller';
import { ArticleNature } from './entities/article-nature.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleNature]), UserModule],
  controllers: [ArticleNatureController],
  providers: [ArticleNatureService],
  exports: [ArticleNatureService],
})
export class ArticleNatureModule {}
