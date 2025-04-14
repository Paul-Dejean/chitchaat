import { Controller, Get, Param, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { MediasoupService } from '@/mediasoup/mediasoup.service';
import ShortUniqueId from 'short-unique-id';
import { ZodValidationPipe } from '@/zod-validation/zod-validation.pipe';
import { getRoomByIdSchema } from './rooms.schemas';
const { randomUUID } = new ShortUniqueId({ length: 10 });

@Controller('rooms')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private mediasoupService: MediasoupService,
  ) {}

  @Get(':roomId')
  async getRoomById(
    @Param('roomId', new ZodValidationPipe(getRoomByIdSchema)) roomId: string,
  ) {
    const room = await this.roomsService.getRoomById(roomId);
    console.log({ peers: room?.peers });
    return room;
  }
  @Post()
  async createRoom() {
    const roomId = randomUUID();
    const router = await this.mediasoupService.createRouter();
    return this.roomsService.createRoom(roomId, router);
  }
}
