import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { types as MediasoupTypes } from 'mediasoup';

type Room = {
  id: string;
  peers: Peer[];
  router: MediasoupTypes.Router;
  producers: MediasoupTypes.Producer[];
  consumers: MediasoupTypes.Consumer[];
  transports: MediasoupTypes.Transport[];
};

type Peer = {
  displayName: string;
  id: string;
};
@Injectable()
export class RoomsService {
  rooms: Room[] = [];
  constructor() {}

  getRoomById(roomId: string) {
    return this.rooms.find((room) => room.id === roomId);
  }

  async createRoom(roomId: string, router: MediasoupTypes.Router) {
    const room = {
      id: roomId,
      router,
      peers: [],
      producers: [],
      consumers: [],
      transports: [],
    };
    this.rooms.push(room);
    return room;
  }

  joinRoom(roomId: string, displayName: string) {
    const room = this.getRoomById(roomId);
    const peerId = randomUUID();
    room.peers.push({ displayName, id: peerId });
    return { peerId, room };
  }

  getTransportById(roomId: string, transportId: string) {
    const room = this.getRoomById(roomId);
    return room.transports.find((transport) => transport.id === transportId);
  }

  addTransport(roomId: string, transport: MediasoupTypes.Transport) {
    const room = this.getRoomById(roomId);
    room.transports.push(transport);
    return transport;
  }

  getProducerById(roomId: string, producerId: string) {
    const room = this.getRoomById(roomId);
    return room.producers.find((producer) => producer.id === producerId);
  }

  addProducer(roomId: string, producer: MediasoupTypes.Producer) {
    const room = this.getRoomById(roomId);
    room.producers.push(producer);
    return producer;
  }

  getConsumerById(roomId: string, consumerId: string) {
    const room = this.getRoomById(roomId);
    return room.consumers.find((consumer) => consumer.id === consumerId);
  }

  addConsumer(roomId: string, consumer: MediasoupTypes.Consumer) {
    const room = this.getRoomById(roomId);
    room.consumers.push(consumer);
    return consumer;
  }
}
