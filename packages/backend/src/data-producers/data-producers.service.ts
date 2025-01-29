import { Injectable } from '@nestjs/common';
import { RoomsService } from 'src/rooms/rooms.service';

@Injectable()
export class DataProducersService {
  constructor(private roomsService: RoomsService) {}

  async createDataProducer({
    peerId,
    roomId,
    transportId,
    sctpStreamParameters,
  }: {
    peerId: string;
    roomId: string;
    transportId: string;
    sctpStreamParameters: any;
  }) {
    const room = await this.roomsService.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const transport = await this.roomsService.getTransportById(
      roomId,
      transportId,
    );
    if (!transport) {
      throw new Error('Transport not found');
    }

    const dataProducer = await transport.produceData({
      sctpStreamParameters,
    });

    this.roomsService.addDataProducer(roomId, peerId, dataProducer);

    return dataProducer;
  }

  async createDataConsumer({
    peerId,
    roomId,
    dataProducerId,
    transportId,
  }: {
    peerId: string;
    roomId: string;
    transportId: string;
    dataProducerId: string;
  }) {
    const room = await this.roomsService.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const transport = await this.roomsService.getTransportById(
      roomId,
      transportId,
    );
    if (!transport) {
      throw new Error('DataProducer not found');
    }

    const dataConsumer = await transport.consumeData({ dataProducerId });

    this.roomsService.addDataConsumer(roomId, peerId, dataConsumer);

    return dataConsumer;
  }
}
