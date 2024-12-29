import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediasoupService } from './mediasoup/mediasoup.service';

import { MediasoupGateway } from './mediasoup/mediasoup.gateway';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './logging/logging.interceptor';

@Module({
  imports: [],
  controllers: [AppController, RoomsController],
  providers: [
    AppService,
    MediasoupService,
    MediasoupGateway,
    RoomsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
