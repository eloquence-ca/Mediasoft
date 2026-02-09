import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as ConfigEnv } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { FileModule } from './file/file.module';
import { TenantModule } from './tenant/tenant.module';
import { CompanyModule } from './company/company.module';
import { AddressModule } from './address/address.module';
import { CountryModule } from './country/country.module';
import { CityModule } from './city/city.module';
import { CustomerModule } from './customer/customer.module';
import { ContactModule } from './contact/contact.module';
import { NumberingModule } from './numbering/numbering.module';
import { InternalNoteModule } from './internal-note/internal-note.module';
import { ConditionRegulationModule } from './condition-regulation/condition-regulation.module';
import { TvaRateModule } from './tva-rate/tva-rate.module';
import { DirectoryModule } from './directory/directory.module';
import { CommonModule } from './common/common.module';
import { UnitModule } from './unit/unit.module';
import { ArticleModule } from './article/article.module';
import { ArticleNatureModule } from './article-nature/article-nature.module';
import { CatalogModule } from './catalog/catalog.module';
import { CommentaireModule } from './commentaire/commentaire.module';
import { FamilyModule } from './family/family.module';
import { JobModule } from './job/job.module';
import { LigneOuvrageModule } from './ligne-ouvrage/ligne-ouvrage.module';
import { OuvrageModule } from './ouvrage/ouvrage.module';
import { DocumentModule } from './document/document.module';
import { AddressCloneModule } from './address-clone/address-clone.module';
import { PaymentModule } from './payment/payment.module';
import { WorkflowModule } from './workflow/workflow.module';
import { DocumentStatusModule } from './document-status/document-status.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigEnv.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    CommonModule,
    MailModule,
    AuthModule,
    UserModule,
    FileModule,
    TenantModule,
    CompanyModule,
    AddressModule,
    AddressCloneModule,
    CountryModule,
    CityModule,
    CustomerModule,
    ContactModule,
    NumberingModule,
    InternalNoteModule,
    ConditionRegulationModule,
    TvaRateModule,
    DirectoryModule,
    UnitModule,
    ArticleModule,
    ArticleNatureModule,
    CatalogModule,
    CommentaireModule,
    FamilyModule,
    JobModule,
    LigneOuvrageModule,
    OuvrageModule,
    UnitModule,
    DocumentModule,
    AddressModule,
    PaymentModule,
    WorkflowModule,
    DocumentStatusModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
