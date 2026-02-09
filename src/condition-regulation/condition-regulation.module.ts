import { Module } from '@nestjs/common';
import { ConditionRegulationService } from './condition-regulation.service';
import { ConditionRegulationController } from './condition-regulation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionRegulation } from './entities/condition-regulation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionRegulation])],
  controllers: [ConditionRegulationController],
  providers: [ConditionRegulationService],
})
export class ConditionRegulationModule {}
