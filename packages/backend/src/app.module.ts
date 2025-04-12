import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediasoupService } from './mediasoup/mediasoup.service';

import { MediasoupGateway } from './mediasoup/mediasoup.gateway';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './logging/logging.interceptor';
import { TransportsService } from './transports/transports.service';
import { ConsumersService } from './consumers/consumers.service';
import { ProducersService } from './producers/producers.service';
import { ClientsService } from './clients/clients.service';
import { WsExceptionFilter } from './common/filters/ws-exception-filter/ws-exception-filter';
import { DataProducersService } from './data-producers/data-producers.service';

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
    TransportsService,
    ConsumersService,
    ProducersService,
    ClientsService,
    WsExceptionFilter,
    DataProducersService,
  ],
})
export class AppModule {}
