import { Body, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { MediasoupService } from './mediasoup.service';
@WebSocketGateway({ cors: '*' })
export class MediasoupGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MediasoupGateway.name);
  constructor(
    private readonly mediasoupService: MediasoupService,
    private readonly roomService: RoomsService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    client.onAny((event, args) => console.log({ event, args }));
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const room of this.roomService.rooms) {
      if (room.peers.some((peer) => peer.id === client.id)) {
        this.roomService.deletePeer(room.id, client.id);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @Body() { roomId }: { roomId: string },
  ) {
    await client.join(roomId);
    console.log({ socketId: client.id, roomId });
    const room = this.roomService.joinRoom(roomId, {
      id: client.id,
    });
    const newPeer = room.peers.find((peer) => peer.id === client.id);
    this.server
      .to(roomId)
      .emit('newPeer', { id: newPeer.id, displayName: newPeer.displayName });
    return room;
  }

  @SubscribeMessage('createTransport')
  async createTransport(
    @ConnectedSocket() client: Socket,
    @Body() { roomId }: { roomId: string },
  ) {
    const transport = await this.mediasoupService.createWebRtcTransport(
      roomId,
      client.id,
    );

    transport.on('icestatechange', (iceState) => {
      if (iceState === 'disconnected' || iceState === 'closed') {
        client.disconnect();
        console.log('iceStateChange failed - client deconnected', iceState);
      }
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        client.disconnect();
        console.log('dtlsStateChange failed - client deconnected', dtlsState);
      }
    });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage('connectTransport')
  async connect(@Body() { roomId, transportId, dtlsParameters }) {
    console.log({ transportId, dtlsParameters });
    await this.mediasoupService.connect(roomId, transportId, dtlsParameters);
  }

  @SubscribeMessage('produce')
  async produce(
    @ConnectedSocket() client: Socket,
    @Body() { roomId, transportId, kind, rtpParameters },
  ) {
    const producer = await this.mediasoupService.produce({
      peerId: client.id,
      roomId,
      transportId,
      kind,
      rtpParameters,
    });
    this.server
      .to(roomId)
      .emit('newProducer', { producerId: producer.id, peerId: client.id });
    return { producerId: producer.id };
  }

  @SubscribeMessage('consume')
  async consume(
    @ConnectedSocket() client: Socket,
    @Body() { roomId, producerId, rtpCapabilities, consumerId },
  ) {
    const consumer = await this.mediasoupService.consume({
      peerId: client.id,
      roomId,
      consumerId,
      producerId,
      rtpCapabilities,
    });
    consumer.on('producerclose', () => {
      this.server
        .to(roomId)
        .emit('consumerClosed', { consumerId: consumer.id });
    });

    consumer.on('producerpause', () => {
      this.server
        .to(roomId)
        .emit('consumerPaused', { consumerId: consumer.id });
    });

    consumer.on('producerresume', () => {
      this.server
        .to(roomId)
        .emit('consumerResumed', { consumerId: consumer.id });
    });
    return {
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      id: consumer.id,
    };
  }

  @SubscribeMessage('resumeProducer')
  async resumeProducer(
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.mediasoupService.resumeProducer(roomId, producerId);
    this.server.to(roomId).emit('producerResumed', { producerId });
  }

  @SubscribeMessage('pauseProducer')
  async pauseProducer(
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.mediasoupService.pauseProducer(roomId, producerId);
    this.server.to(roomId).emit('producerPaused', { producerId });
  }

  @SubscribeMessage('closeProducer')
  async closeProducer(
    @ConnectedSocket() client: Socket,
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.mediasoupService.closeProducer(roomId, producerId);
    await this.roomService.deleteProducer(roomId, client.id, producerId);
    this.server.to(roomId).emit('producerClosed', { producerId });
  }

  @SubscribeMessage('resumeConsumer')
  async resumeConsumer(
    @Body() { consumerId, roomId }: { consumerId: string; roomId: string },
  ) {
    await this.mediasoupService.resumeConsumer(roomId, consumerId);
    this.server.to(roomId).emit('consumerResumed', { consumerId });
  }
  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(@Body() { roomId }: { roomId: string }) {
    return {
      routerRtpCapabilities:
        await this.mediasoupService.getRouterRtpCapabilities(roomId),
    };
  }
}
