import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { types as MediasoupTypes } from 'mediasoup';
import { MediasoupService } from 'src/mediasoup/mediasoup.service';

type Room = {
  id: string;
  peers: Peer[];
  router: MediasoupTypes.Router;
};

type Peer = {
  displayName: string;
};
@Injectable()
export class RoomsService {
  rooms: Room[] = [];
  constructor(private mediasoupService: MediasoupService) {}

  getRoomById(roomId: string) {
    return this.rooms.find((room) => room.id === roomId);
  }

  async createRoom() {
    const roomId = randomUUID();
    const router = await this.mediasoupService.createRouter(roomId);
    const room = {
      id: roomId,
      peers: [],
      router,
    };
    this.rooms.push(room);
    return room;
  }

  joinRoom(roomId: string, displayName: string) {
    const room = this.getRoomById(roomId);
    room.peers.push({ displayName });
  }
}
