import { Injectable } from '@nestjs/common';

import { EventEmitter } from 'stream';
import { types as MediasoupTypes } from 'mediasoup';
import { RoomsService } from '@/rooms/rooms.service';

@Injectable()
export class ConsumersService extends EventEmitter {
  constructor(private roomsService: RoomsService) {
    super();
  }
  async createConsumer({
    consumerId,
    peerId,
    producerId,
    roomId,
    rtpCapabilities,
  }: {
    peerId: string;
    roomId: string;
    consumerId: string;
    producerId: string;
    rtpCapabilities: MediasoupTypes.RtpCapabilities;
  }) {
    const consumerTransport = await this.roomsService.getTransportById(
      roomId,
      consumerId,
    );

    if (!consumerTransport) {
      throw new Error('Transport not found');
    }

    const room = await this.roomsService.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume');
    }

    const consumer = await consumerTransport.consume({
      producerId,
      rtpCapabilities,
      paused: true, // Start in paused state, resume after transport connect
    });

    consumer.on('transportclose', () => {
      this.roomsService.deleteConsumer(roomId, peerId, consumer.id);
    });

    consumer.on('producerclose', () => {
      this.roomsService.deleteConsumer(roomId, peerId, consumer.id);
    });

    consumer.on('producerclose', () => {
      this.emit('producerClosed', { roomId, consumerId: consumer.id });
    });

    consumer.on('producerpause', () => {
      this.emit('producerPaused', { roomId, consumerId: consumer.id });
    });

    consumer.on('producerresume', () => {
      this.emit('producerResumed', { roomId, consumerId: consumer.id });
    });

    this.roomsService.addConsumer(roomId, peerId, consumer);

    return consumer;
  }

  async resumeConsumer(roomId: string, consumerId: string) {
    const consumer = this.roomsService.getConsumerById(roomId, consumerId);
    if (!consumer) {
      throw new Error('Consumer not found');
    }
    await consumer.resume();
  }
}
