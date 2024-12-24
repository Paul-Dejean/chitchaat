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
import { Body } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class MediasoupGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly mediasoupService: MediasoupService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`, args);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createTransport')
  async createTransport(@ConnectedSocket() client: Socket) {
    const transport = await this.mediasoupService.createWebRtcTransport();
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage('connectTransport')
  async connect(
    @ConnectedSocket() client: Socket,
    @Body() { transportId, dtlsParameters },
  ) {
    console.log({ transportId, dtlsParameters });
    await this.mediasoupService.connect(transportId, dtlsParameters);
  }
  @SubscribeMessage('produce')
  async produce(
    @ConnectedSocket() client: Socket,
    @Body() { transportId, kind, rtpParameters },
  ) {
    console.log({ transportId, kind, rtpParameters });
    const producer = await this.mediasoupService.produce(
      transportId,
      kind,
      rtpParameters,
    );
    console.log({ producer });
    console.log({ producerId: producer.id });
    return producer.id;
  }

  @SubscribeMessage('consume')
  async consume(
    @ConnectedSocket() client: Socket,
    @Body() { producerId, rtpCapabilities, consumerId },
  ) {
    console.log({ producerId, rtpCapabilities, consumerId });
    const consumer = await this.mediasoupService.consume(
      consumerId,
      producerId,
      rtpCapabilities,
    );
    console.log({ consumer });
    return {
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      id: consumer.id,
    };
  }
  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(@ConnectedSocket() client: Socket) {
    return {
      routerRtpCapabilities:
        await this.mediasoupService.getRouterRtpCapabilities(),
    };
  }
}
