import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConsumersService } from 'src/consumers/consumers.service';
import { ProducersService } from 'src/producers/producers.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { TransportsService } from 'src/transports/transports.service';
import { ZodValidationPipe } from 'src/zod-validation/zod-validation.pipe';
import {
  closeProducerSchema,
  ConnectTransportDto,
  connectTransportSchema,
  CreateConsumerDto,
  createConsumerSchema,
  CreateProducerDto,
  createProducerSchema,
  CreateTransportDto,
  createTransportSchema,
  getRouterRtpCapabilitiesSchema,
  JoinRoomDto,
  joinRoomSchema,
  pauseProducerSchema,
  resumeConsumerSchema,
  resumeProducerSchema,
} from './mediasoup.schemas';
import { ClientsService } from 'src/clients/clients.service';
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
    private readonly clientsService: ClientsService,
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
    this.clientsService.addClient(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const room = this.roomService.getRoomByPeerId(client.id);
    if (!room) return;
    this.roomService.deletePeer(room.id, client.id);
    this.server.to(room.id).emit('peerClosed', { peerId: client.id });
    this.clientsService.removeClient(client);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(joinRoomSchema))
    { roomId }: JoinRoomDto,
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
    @MessageBody(new ZodValidationPipe(createTransportSchema))
    { roomId }: CreateTransportDto,
  ) {
    const transport = await this.transportsService.createWebRtcTransport(
      roomId,
      client.id,
    );

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage('connectTransport')
  async connectTransport(
    @MessageBody(new ZodValidationPipe(connectTransportSchema))
    { roomId, transportId, dtlsParameters }: ConnectTransportDto,
  ) {
    console.log({ transportId, dtlsParameters });
    await this.transportsService.connectTransport(
      roomId,
      transportId,
      dtlsParameters,
    );
  }

  @SubscribeMessage('produce')
  async createProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(createProducerSchema))
    { roomId, transportId, kind, rtpParameters }: CreateProducerDto,
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
  async createConsumer(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(createConsumerSchema))
    { roomId, producerId, rtpCapabilities, consumerId }: CreateConsumerDto,
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
    @MessageBody(new ZodValidationPipe(resumeProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.resumeProducer(roomId, producerId);
    this.server.to(roomId).emit('producerResumed', { producerId });
  }

  @SubscribeMessage('pauseProducer')
  async pauseProducer(
    @MessageBody(new ZodValidationPipe(pauseProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.pauseProducer(roomId, producerId);
    this.server.to(roomId).emit('producerPaused', { producerId });
  }

  @SubscribeMessage('closeProducer')
  async closeProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(closeProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.closeProducer(roomId, producerId);
    await this.roomService.deleteProducer(roomId, client.id, producerId);
    this.server.to(roomId).emit('producerClosed', { producerId });
  }

  @SubscribeMessage('resumeConsumer')
  async resumeConsumer(
    @MessageBody(new ZodValidationPipe(resumeConsumerSchema))
    { consumerId, roomId }: { consumerId: string; roomId: string },
  ) {
    await this.consumersService.resumeConsumer(roomId, consumerId);
    this.server.to(roomId).emit('consumerResumed', { consumerId });
  }
  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(
    @MessageBody(new ZodValidationPipe(getRouterRtpCapabilitiesSchema))
    { roomId }: { roomId: string },
  ) {
    return {
      routerRtpCapabilities:
        await this.roomService.getRouterRtpCapabilities(roomId),
    };
  }
}
