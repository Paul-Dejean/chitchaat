import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: fs.readFileSync('cert/10.40.119.136-key.pem'),
      cert: fs.readFileSync('cert/10.40.119.136.pem'),
    },
  });

  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific HTTP methods
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0', () => {
    console.log(`Listening on port ${process.env.PORT ?? 3001}`);
  });
}
bootstrap();
