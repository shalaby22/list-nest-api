import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableCors();
  app.use(helmet());
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('ListNest API')
    .setDescription('Documentation for ListNest endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  Logger.log(
    `Application successfully started on port ${process.env.PORT || 3000}`,
    'Bootstrap',
  );
}

bootstrap().catch((err: { stack: any }) => {
  Logger.error('Failed to start application', err.stack, 'Bootstrap');
  process.exit(1);
});
