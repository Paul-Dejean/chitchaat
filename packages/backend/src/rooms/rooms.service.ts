import { Injectable } from '@nestjs/common';
import { types as MediasoupTypes } from 'mediasoup';

type Room = {
  id: string;
  peers: Peer[];
  router: MediasoupTypes.Router;
  producers: Map<string, MediasoupTypes.Producer>;
  consumers: Map<string, MediasoupTypes.Consumer>;
  transports: Map<string, MediasoupTypes.Transport>;
};

type Peer = {
  displayName: string;
  id: string;
  producers: MediasoupTypes.Producer[];
  consumers: MediasoupTypes.Consumer[];
  transports: MediasoupTypes.Transport[];
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
      producers: new Map(),
      consumers: new Map(),
      transports: new Map(),
    };
    this.rooms.push(room);
    return room;
  }

  joinRoom(roomId: string, newPeer: { displayName: string; id: string }) {
    const room = this.getRoomById(roomId);
    room.peers.push({
      ...newPeer,
      producers: [],
      consumers: [],
      transports: [],
    });
    return room;
  }

  getTransportById(roomId: string, transportId: string) {
    const room = this.getRoomById(roomId);
    return room.transports.get(transportId);
  }

  addTransport(
    roomId: string,
    peerId: string,
    transport: MediasoupTypes.Transport,
  ) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.transports.push(transport);
    room.transports.set(transport.id, transport);
    console.log({ room });
    return transport;
  }

  getProducerById(roomId: string, producerId: string) {
    const room = this.getRoomById(roomId);
    return room.producers.get(producerId);
  }

  addProducer(
    roomId: string,
    peerId: string,
    producer: MediasoupTypes.Producer,
  ) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.producers.push({ ...producer, id: producer.id });
    room.producers.set(producer.id, producer);
    console.log('added producer', { room });
    return producer;
  }

  getConsumerById(roomId: string, consumerId: string) {
    const room = this.getRoomById(roomId);
    return room.consumers.get(consumerId);
  }

  addConsumer(
    roomId: string,
    peerId: string,
    consumer: MediasoupTypes.Consumer,
  ) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.consumers.push(consumer);
    room.consumers.set(consumer.id, consumer);
    console.log({ room });
    return consumer;
  }
}
