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
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @Body() { roomId, displayName }: { roomId: string; displayName: string },
  ) {
    await client.join(roomId);
    return this.roomService.joinRoom(roomId, displayName);
  }

  @SubscribeMessage('createTransport')
  async createTransport(@Body() { roomId }: { roomId: string }) {
    const transport = await this.mediasoupService.createWebRtcTransport(roomId);
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
  async produce(@Body() { roomId, transportId, kind, rtpParameters, peerId }) {
    const producer = await this.mediasoupService.produce(
      roomId,
      transportId,
      kind,
      rtpParameters,
      peerId,
    );
    this.server
      .to(roomId)
      .emit('newProducer', { producerId: producer.id, peerId });
    return { producerId: producer.id };
  }

  @SubscribeMessage('consume')
  async consume(@Body() { roomId, producerId, rtpCapabilities, consumerId }) {
    const consumer = await this.mediasoupService.consume(
      roomId,
      consumerId,
      producerId,
      rtpCapabilities,
    );
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
  }

  @SubscribeMessage('pauseProducer')
  async pauseProducer(
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.mediasoupService.pauseProducer(roomId, producerId);
  }

  @SubscribeMessage('closeProducer')
  async closeProducer(
    @Body() { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.mediasoupService.closeProducer(roomId, producerId);
  }

  @SubscribeMessage('resumeConsumer')
  async resumeConsumer(
    @Body() { consumerId, roomId }: { consumerId: string; roomId: string },
  ) {
    await this.mediasoupService.resumeConsumer(roomId, consumerId);
  }
  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(@Body() { roomId }: { roomId: string }) {
    return {
      routerRtpCapabilities:
        await this.mediasoupService.getRouterRtpCapabilities(roomId),
    };
  }
}
