import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediasoupService } from './mediasoup/mediasoup.service';

import { MediasoupGateway } from './mediasoup/mediasoup.gateway';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './logging/logging.interceptor';
import { DisplayNameGeneratorService } from './display-name-generator/display-name-generator.service';
import { TransportsService } from './transports/transports.service';
import { ConsumersService } from './consumers/consumers.service';
import { ProducersService } from './producers/producers.service';
import { ClientsService } from './clients/clients.service';
import { WsExceptionFilter } from './common/filters/ws-exception-filter/ws-exception-filter';

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
    DisplayNameGeneratorService,
    TransportsService,
    ConsumersService,
    ProducersService,
    ClientsService,
    WsExceptionFilter,
  ],
})
export class AppModule {}
