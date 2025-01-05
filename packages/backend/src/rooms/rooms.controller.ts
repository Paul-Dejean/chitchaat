import { Controller, Get, Param, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get(':roomId')
  async getRoomById(@Param('roomId') roomId: string) {
    return this.roomsService.getRoomById(roomId);
  }
  @Post()
  async createRoom() {
    return this.roomsService.createRoom();
  }
}
