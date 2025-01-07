import { Controller, Get, Param, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { MediasoupService } from 'src/mediasoup/mediasoup.service';
import { randomUUID } from 'crypto';

@Controller('rooms')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private mediasoupService: MediasoupService,
  ) {}

  @Get(':roomId')
  async getRoomById(@Param('roomId') roomId: string) {
    return this.roomsService.getRoomById(roomId);
  }
  @Post()
  async createRoom() {
    const roomId = randomUUID();
    const router = await this.mediasoupService.createRouter();
    return this.roomsService.createRoom(roomId, router);
  }
}
