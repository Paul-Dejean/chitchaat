import { Injectable } from '@nestjs/common';
import { types as MediasoupTypes } from 'mediasoup';
import { DisplayNameGeneratorService } from '@/display-name-generator/display-name-generator.service';

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
  dataProducers: MediasoupTypes.DataProducer[];
  dataConsumers: MediasoupTypes.DataConsumer[];
};
@Injectable()
export class RoomsService {
  rooms: Room[] = [];

  constructor(private displayNameGenerator: DisplayNameGeneratorService) {}

  getRoomById(roomId: string) {
    return this.rooms.find((room) => room.id === roomId) ?? null;
  }

  getRoomByPeerId(peerId: string) {
    return (
      this.rooms.find((room) =>
        room.peers.some((peer) => peer.id === peerId),
      ) ?? null
    );
  }

  createRoom(roomId: string, router: MediasoupTypes.Router) {
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
    if (!room) {
      throw new Error('Room not found');
    }
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
      dataProducers: [],
      dataConsumers: [],
    };

    room.peers.push(peer);

    return { room, newPeer: peer };
  }

  deletePeer(roomId: string, peerId: string) {
    const room = this.getRoomById(roomId);
    if (!room) return;
    if (room.isClosed) return;

    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) return;
    peer.transports.forEach((transport) => transport.close());
    room.peers = room.peers.filter((peer) => peer.id !== peerId);
    if (room.peers.length === 0) {
      room.router.close();
      room.isClosed = true;
    }
  }

  getTransportById(roomId: string, transportId: string) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return (
      room.peers
        .flatMap((peer) => peer.transports)
        .find((transport) => transport.id === transportId) ?? null
    );
  }

  addTransport(
    roomId: string,
    peerId: string,
    transport: MediasoupTypes.Transport,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.transports.push(transport);
    return transport;
  }

  getProducerById(roomId: string, producerId: string) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return (
      room.peers
        .flatMap((peer) => peer.producers)
        .find((producer) => producer.id === producerId) ?? null
    );
  }

  addProducer(
    roomId: string,
    peerId: string,
    producer: MediasoupTypes.Producer,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.producers.push(producer);

    return producer;
  }

  deleteProducer(roomId: string, peerId: string, producerId: string) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.producers = peer.producers.filter(
      (producer) => producer.id !== producerId,
    );
  }

  getConsumerById(roomId: string, consumerId: string) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return (
      room.peers
        .flatMap((peer) => peer.consumers)
        .find((consumer) => consumer.id === consumerId) ?? null
    );
  }

  addConsumer(
    roomId: string,
    peerId: string,
    consumer: MediasoupTypes.Consumer,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.consumers.push(consumer);
    return consumer;
  }

  deleteConsumer(roomId: string, peerId: string, consumerId: string) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.consumers = peer.consumers.filter(
      (consumer) => consumer.id !== consumerId,
    );
  }

  public async getRouterRtpCapabilities(roomId: string) {
    const room = await this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room.router.rtpCapabilities;
  }

  public async addDataProducer(
    roomId: string,
    peerId: string,
    dataProducer: MediasoupTypes.DataProducer,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.dataProducers.push(dataProducer);
    return dataProducer;
  }

  public async deleteDataProducer(
    roomId: string,
    peerId: string,
    dataProducerId: string,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.dataProducers = peer.dataProducers.filter(
      (dataProducer) => dataProducer.id !== dataProducerId,
    );
  }

  public async addDataConsumer(
    roomId: string,
    peerId: string,
    dataConsumer: MediasoupTypes.DataConsumer,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.dataConsumers.push(dataConsumer);
    return dataConsumer;
  }

  public async deleteDataConsumer(
    roomId: string,
    peerId: string,
    dataConsumerId: string,
  ) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    const peer = room.peers.find((peer) => peer.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    peer.dataConsumers = peer.dataConsumers.filter(
      (dataConsumer) => dataConsumer.id !== dataConsumerId,
    );
  }
}
