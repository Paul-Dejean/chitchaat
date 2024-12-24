import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediasoupService } from './mediasoup/mediasoup.service';

import { MediasoupGateway } from './mediasoup/mediasoup.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, MediasoupService, MediasoupGateway],
})
export class AppModule {}
