import { Injectable } from '@nestjs/common';
import { types as MediasoupTypes } from 'mediasoup';
import { DisplayNameGeneratorService } from 'src/display-name-generator/display-name-generator.service';
import util from 'util';
util.inspect.defaultOptions.depth = null;

type Room = {
  id: string;
  peers: Peer[];
  isClosed: boolean;
  router: MediasoupTypes.Router;
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

  constructor(private displayNameGenerator: DisplayNameGeneratorService) {}

  getRoomById(roomId: string) {
    return this.rooms.find((room) => room.id === roomId);
  }

  getRoomByPeerId(peerId: string) {
    return this.rooms.find((room) =>
      room.peers.some((peer) => peer.id === peerId),
    );
  }

  async createRoom(roomId: string, router: MediasoupTypes.Router) {
    const room = {
      id: roomId,
      router,
      peers: [],
      isClosed: false,
      producers: new Map(),
      consumers: new Map(),
      transports: new Map(),
    };
    this.rooms.push(room);
    return room;
  }

  joinRoom(roomId: string, newPeer: { id: string }) {
    const room = this.getRoomById(roomId);
    if (room.peers.some((peer) => peer.id === newPeer.id)) {
      throw new Error('Peer has already joined the room');
    }
    let displayName = this.displayNameGenerator.generateDisplayName();
    while (room.peers.some((peer) => peer.displayName === displayName)) {
      displayName = this.displayNameGenerator.generateDisplayName();
    }

    const peer = {
      id: newPeer.id,
      displayName,
      producers: [],
      consumers: [],
      transports: [],
    };

    room.peers.push(peer);

    return { room, newPeer: peer };
  }

  deletePeer(roomId: string, peerId: string) {
    const room = this.getRoomById(roomId);
    if (room.isClosed) return;

    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.transports.forEach((transport) => transport.close());
    room.peers = room.peers.filter((peer) => peer.id !== peerId);
    if (room.peers.length === 0) {
      room.router.close();
      room.isClosed = true;
    }
  }

  getTransportById(roomId: string, transportId: string) {
    const room = this.getRoomById(roomId);
    return room.peers
      .flatMap((peer) => peer.transports)
      .find((transport) => transport.id === transportId);
  }

  addTransport(
    roomId: string,
    peerId: string,
    transport: MediasoupTypes.Transport,
  ) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.transports.push(transport);
    return transport;
  }

  getProducerById(roomId: string, producerId: string) {
    const room = this.getRoomById(roomId);
    return room.peers
      .flatMap((peer) => peer.producers)
      .find((producer) => producer.id === producerId);
  }

  addProducer(
    roomId: string,
    peerId: string,
    producer: MediasoupTypes.Producer,
  ) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.producers.push(producer);

    return producer;
  }

  deleteProducer(roomId: string, peerId: string, producerId: string) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.producers = peer.producers.filter(
      (producer) => producer.id !== producerId,
    );
  }

  getConsumerById(roomId: string, consumerId: string) {
    const room = this.getRoomById(roomId);
    return room.peers
      .flatMap((peer) => peer.consumers)
      .find((consumer) => consumer.id === consumerId);
  }

  addConsumer(
    roomId: string,
    peerId: string,
    consumer: MediasoupTypes.Consumer,
  ) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.consumers.push(consumer);
    return consumer;
  }

  deleteConsumer(roomId: string, peerId: string, consumerId: string) {
    const room = this.getRoomById(roomId);
    const peer = room.peers.find((peer) => peer.id === peerId);
    peer.consumers = peer.consumers.filter(
      (consumer) => consumer.id !== consumerId,
    );
  }

  public async getRouterRtpCapabilities(roomId: string) {
    const room = await this.getRoomById(roomId);
    return room.router.rtpCapabilities;
  }
}
