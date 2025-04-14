import { Logger, UseFilters } from '@nestjs/common';
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
import { ConsumersService } from '@/consumers/consumers.service';
import { ProducersService } from '@/producers/producers.service';
import { RoomsService } from '@/rooms/rooms.service';
import { TransportsService } from '@/transports/transports.service';
import { ZodValidationPipe } from '@/zod-validation/zod-validation.pipe';
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
import { ClientsService } from '@/clients/clients.service';
import { WsExceptionFilter } from '@/common/filters/ws-exception-filter/ws-exception-filter';
import { DataProducersService } from '@/data-producers/data-producers.service';
@WebSocketGateway({ cors: '*' })
@UseFilters(WsExceptionFilter)
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
    private readonly dataProducersService: DataProducersService,
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
    { roomId, displayName }: JoinRoomDto,
  ) {
    await client.join(roomId);
    const { room, newPeer } = this.roomService.joinRoom(roomId, {
      id: client.id,
      displayName,
    });

    this.server
      .to(roomId)
      .except(client.id)
      .emit('newPeer', { id: newPeer.id, displayName: newPeer.displayName });

    console.log({ peers: room.peers });

    return {
      room: {
        ...room,
        peers: room.peers.map((peer) => ({
          id: peer.id,
          displayName: peer.displayName,
          producers: peer.producers.map((producer) => ({ id: producer.id })),
          dataProducers: peer.dataProducers.map((dataProducer) => ({
            id: dataProducer.id,
          })),
        })),
      },
      displayName: newPeer.displayName,
    };
  }

  @SubscribeMessage('createTransport')
  async createTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(createTransportSchema))
    { roomId, sctpCapabilities }: CreateTransportDto,
  ) {
    console.log({ roomId, sctpCapabilities });
    const transport = await this.transportsService.createWebRtcTransport(
      roomId,
      client.id,
      sctpCapabilities,
    );

    console.log({ transport });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    };
  }

  @SubscribeMessage('connectTransport')
  async connectTransport(
    @MessageBody(new ZodValidationPipe(connectTransportSchema))
    { roomId, transportId, dtlsParameters }: ConnectTransportDto,
  ) {
    await this.transportsService.connectTransport(
      roomId,
      transportId,
      dtlsParameters,
    );
    return { isConnected: true };
  }

  @SubscribeMessage('createProducer')
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
      .except(client.id)
      .emit('newProducer', { producerId: producer.id, peerId: client.id });
    return { producerId: producer.id };
  }

  @SubscribeMessage('createConsumer')
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

  @SubscribeMessage('createDataProducer')
  async createDataProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    { roomId, transportId, sctpStreamParameters }: any,
  ) {
    const dataProducer = await this.dataProducersService.createDataProducer({
      peerId: client.id,
      roomId,
      transportId,
      sctpStreamParameters,
    });
    this.server.to(roomId).except(client.id).emit('newDataProducer', {
      dataProducerId: dataProducer.id,
      peerId: client.id,
      sctpStreamParameters,
    });
    return { dataProducerId: dataProducer.id, transportId };
  }
  @SubscribeMessage('createDataConsumer')
  async createDataConsumer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    {
      roomId,
      dataProducerId,
      transportId,
    }: { roomId: string; dataProducerId: string; transportId: string },
  ) {
    const dataConsumer = await this.dataProducersService.createDataConsumer({
      roomId,
      dataProducerId,
      peerId: client.id,
      transportId,
    });

    console.log({ dataConsumer });

    return {
      dataConsumerId: dataConsumer.id,
      sctpStreamParameters: dataConsumer.sctpStreamParameters,
    };
  }

  @SubscribeMessage('resumeProducer')
  async resumeProducer(
    @MessageBody(new ZodValidationPipe(resumeProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.resumeProducer(roomId, producerId);
    this.server.to(roomId).emit('producerResumed', { producerId });
    return true;
  }

  @SubscribeMessage('pauseProducer')
  async pauseProducer(
    @MessageBody(new ZodValidationPipe(pauseProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    await this.producersService.pauseProducer(roomId, producerId);
    this.server.to(roomId).emit('producerPaused', { producerId });
    return true;
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
    return true;
  }

  @SubscribeMessage('resumeConsumer')
  async resumeConsumer(
    @MessageBody(new ZodValidationPipe(resumeConsumerSchema))
    { consumerId, roomId }: { consumerId: string; roomId: string },
  ) {
    await this.consumersService.resumeConsumer(roomId, consumerId);
    this.server.to(roomId).emit('consumerResumed', { consumerId });
    return true;
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
