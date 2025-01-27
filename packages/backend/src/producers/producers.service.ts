import { Injectable } from '@nestjs/common';
import { RoomsService } from 'src/rooms/rooms.service';
import { types as MediasoupTypes } from 'mediasoup';

@Injectable()
export class ProducersService {
  constructor(private roomsService: RoomsService) {}
  async createProducer({
    peerId,
    roomId,
    transportId,
    kind,
    rtpParameters,
  }: {
    peerId: string;
    roomId: string;
    transportId: string;
    kind: 'video' | 'audio';
    rtpParameters: MediasoupTypes.RtpParameters;
  }) {
    const transport = await this.roomsService.getTransportById(
      roomId,
      transportId,
    );

    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    this.roomsService.addProducer(roomId, peerId, producer);
    return producer;
  }
  async pauseProducer(roomId: string, producerId: string) {
    const producer = this.roomsService.getProducerById(roomId, producerId);
    await producer.pause();
  }

  async resumeProducer(roomId: string, producerId: string) {
    const producer = this.roomsService.getProducerById(roomId, producerId);
    await producer.resume();
  }

  async closeProducer(roomId: string, producerId: string) {
    const producer = this.roomsService.getProducerById(roomId, producerId);
    await producer.close();
  }
}
