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
import { MediasoupService } from './mediasoup.service';
@WebSocketGateway({ cors: '*' })
export class MediasoupGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MediasoupGateway.name);
  constructor(private readonly mediasoupService: MediasoupService) {}

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
    @Body() { roomId }: { roomId: string; displayName: string },
  ) {
    // client.join(roomId);
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
  async produce(@Body() { roomId, transportId, kind, rtpParameters }) {
    const producer = await this.mediasoupService.produce(
      roomId,
      transportId,
      kind,
      rtpParameters,
    );
    this.server.emit('newPeer', { producerId: producer.id });
    return producer.id;
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
