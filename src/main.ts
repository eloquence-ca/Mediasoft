import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { createCorsOriginValidator } from './common/helpers/cors.helper';
import { addTagsAutomatically } from './common/helpers/swagger-tag';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(bodyParser.json({ limit: '1024mb' }));
  app.use(bodyParser.urlencoded({ limit: '1024mb', extended: true }));

  app.enableCors({
    origin: createCorsOriginValidator(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.set('etag', false);

  app.use((req, res, next) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use(
      [`/${process.env.SWAGGER_PATH}`, `/${process.env.SWAGGER_PATH}-json`],
      basicAuth({
        challenge: true,
        users: {
          admin: process.env.BASIC_AUTH_PASSWORD ?? '',
        },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle(`API ${process.env.APP_NAME}`)
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    addTagsAutomatically(app, document);

    SwaggerModule.setup(`${process.env.SWAGGER_PATH}`, app, document, {
      jsonDocumentUrl: `${process.env.SWAGGER_PATH}-json`,
    });
  }

  await app.listen(process.env.APP_PORT ?? 5050);
}
bootstrap();
