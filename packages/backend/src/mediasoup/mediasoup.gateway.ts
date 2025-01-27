import { Body, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { ConsumersService } from 'src/consumers/consumers.service';
import { ProducersService } from 'src/producers/producers.service';
import { TransportsService } from 'src/transports/transports.service';
@WebSocketGateway({ cors: '*' })
export class MediasoupGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(MediasoupGateway.name);
  constructor(
    private readonly roomService: RoomsService,
    private readonly consumersService: ConsumersService,
    private readonly producersService: ProducersService,
    private readonly transportsService: TransportsService,
  ) {}

  afterInit(server: Server) {
    this.consumersService.on('producerClosed', ({ roomId, consumerId }) => {
      server.to(roomId).emit('consumerClosed', { consumerId });
    });
    this.consumersService.on('producerPaused', ({ roomId, consumerId }) => {
      server.to(roomId).emit('consumerPaused', { consumerId });
    });
    this.consumersService.on('producerResumed', ({ roomId, consumerId }) => {
      server.to(roomId).emit('consumerResumed', { consumerId });
    });
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const room = this.roomService.getRoomByPeerId(client.id);
    if (!room) return;
    this.roomService.deletePeer(room.id, client.id);
    this.server.to(room.id).emit('peerClosed', { peerId: client.id });
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @Body() { roomId }: { roomId: string },
  ) {
    await client.join(roomId);
    const { room, newPeer } = this.roomService.joinRoom(roomId, {
      id: client.id,
    });

    this.server
      .to(roomId)
      .emit('newPeer', { id: newPeer.id, displayName: newPeer.displayName });

    return {
      ...room,
      peers: room.peers.map((peer) => ({
        id: peer.id,
        displayName: peer.displayName,
        producers: peer.producers.map((producer) => ({ id: producer.id })),
      })),
    };
  }

  @SubscribeMessage('createTransport')
  async createTransport(
    @ConnectedSocket() client: Socket,
    @Body() { roomId }: { roomId: string },
  ) {
    const transport = await this.transportsService.createWebRtcTransport(
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
    await this.transportsService.connectTransport(
      roomId,
      transportId,
      dtlsParameters,
    );
  }

  @SubscribeMessage('produce')
  async produce(
    @ConnectedSocket() client: Socket,
    @Body() { roomId, transportId, kind, rtpParameters },
  ) {
    const producer = await this.producersService.createProducer({
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
    const consumer = await this.consumersService.createConsumer({
      peerId: client.id,
      roomId,
      consumerId,
      producerId,
      rtpCapabilities,
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
    await this.producersService.resumeProducer(roomId, producerId);
    this.server.to(roomId).emit('producerResumed', { producerId });
  }

  @SubscribeMessage('pauseProducer')
  async pauseProducer(
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.pauseProducer(roomId, producerId);
    this.server.to(roomId).emit('producerPaused', { producerId });
  }

  @SubscribeMessage('closeProducer')
  async closeProducer(
    @ConnectedSocket() client: Socket,
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.closeProducer(roomId, producerId);
    await this.roomService.deleteProducer(roomId, client.id, producerId);
    this.server.to(roomId).emit('producerClosed', { producerId });
  }

  @SubscribeMessage('resumeConsumer')
  async resumeConsumer(
    @Body() { consumerId, roomId }: { consumerId: string; roomId: string },
  ) {
    await this.consumersService.resumeConsumer(roomId, consumerId);
    this.server.to(roomId).emit('consumerResumed', { consumerId });
  }
  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(@Body() { roomId }: { roomId: string }) {
    return {
      routerRtpCapabilities:
        await this.roomService.getRouterRtpCapabilities(roomId),
    };
  }
}
