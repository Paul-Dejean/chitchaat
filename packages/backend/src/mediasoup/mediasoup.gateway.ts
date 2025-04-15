import { ClientsService } from '@/clients/clients.service';
import { ConsumersService } from '@/consumers/consumers.service';
import { DataProducersService } from '@/data-producers/data-producers.service';
import { ProducersService } from '@/producers/producers.service';
import { RoomsService } from '@/rooms/rooms.service';
import { TransportsService } from '@/transports/transports.service';
import { ZodValidationPipe } from '@/zod-validation/zod-validation.pipe';
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
  removePresenterSchema,
  resumeConsumerSchema,
  resumeProducerSchema,
  SetPresenterDto,
  setPresenterSchema,
} from './mediasoup.schemas';

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
    try {
      await client.join(roomId);
      const { room, newPeer } = this.roomService.joinRoom(roomId, {
        id: client.id,
        displayName,
      });

      this.server
        .to(roomId)
        .except(client.id)
        .emit('newPeer', { id: newPeer.id, displayName: newPeer.displayName });

      return {
        success: true,
        data: {
          room: {
            ...room,
            peers: room.peers.map((peer) => ({
              id: peer.id,
              displayName: peer.displayName,
              producers: peer.producers.map((producer) => ({
                id: producer.id,
              })),
              dataProducers: peer.dataProducers.map((dataProducer) => ({
                id: dataProducer.id,
              })),
            })),
          },
          displayName: newPeer.displayName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('createTransport')
  async createTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(createTransportSchema))
    { roomId, sctpCapabilities }: CreateTransportDto,
  ) {
    try {
      const transport = await this.transportsService.createWebRtcTransport(
        roomId,
        client.id,
        sctpCapabilities,
      );

      return {
        success: true,
        data: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
          sctpParameters: transport.sctpParameters,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('connectTransport')
  async connectTransport(
    @MessageBody(new ZodValidationPipe(connectTransportSchema))
    { roomId, transportId, dtlsParameters }: ConnectTransportDto,
  ) {
    try {
      await this.transportsService.connectTransport(
        roomId,
        transportId,
        dtlsParameters,
      );
      return {
        success: true,
        data: { isConnected: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('createProducer')
  async createProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(createProducerSchema))
    { roomId, transportId, kind, rtpParameters }: CreateProducerDto,
  ) {
    try {
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
      return {
        success: true,
        data: { producerId: producer.id },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('createConsumer')
  async createConsumer(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(createConsumerSchema))
    { roomId, producerId, rtpCapabilities, consumerId }: CreateConsumerDto,
  ) {
    try {
      const consumer = await this.consumersService.createConsumer({
        peerId: client.id,
        roomId,
        consumerId,
        producerId,
        rtpCapabilities,
      });

      return {
        success: true,
        data: {
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          id: consumer.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('createDataProducer')
  async createDataProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    { roomId, transportId, sctpStreamParameters }: any,
  ) {
    try {
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
      return {
        success: true,
        data: { dataProducerId: dataProducer.id, transportId },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
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
    try {
      const dataConsumer = await this.dataProducersService.createDataConsumer({
        roomId,
        dataProducerId,
        peerId: client.id,
        transportId,
      });

      return {
        success: true,
        data: {
          dataConsumerId: dataConsumer.id,
          sctpStreamParameters: dataConsumer.sctpStreamParameters,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('resumeProducer')
  async resumeProducer(
    @MessageBody(new ZodValidationPipe(resumeProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    try {
      await this.producersService.resumeProducer(roomId, producerId);
      this.server.to(roomId).emit('producerResumed', { producerId });
      return {
        success: true,
        data: { isResumed: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('pauseProducer')
  async pauseProducer(
    @MessageBody(new ZodValidationPipe(pauseProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    try {
      await this.producersService.pauseProducer(roomId, producerId);
      this.server.to(roomId).emit('producerPaused', { producerId });
      return {
        success: true,
        data: { isPaused: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('closeProducer')
  async closeProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(closeProducerSchema))
    { producerId, roomId }: { producerId: string; roomId: string },
  ) {
    try {
      await this.producersService.closeProducer(roomId, producerId);
      await this.roomService.deleteProducer(roomId, client.id, producerId);
      this.server.to(roomId).emit('producerClosed', { producerId });
      return {
        success: true,
        data: { isClosed: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('resumeConsumer')
  async resumeConsumer(
    @MessageBody(new ZodValidationPipe(resumeConsumerSchema))
    { consumerId, roomId }: { consumerId: string; roomId: string },
  ) {
    try {
      await this.consumersService.resumeConsumer(roomId, consumerId);
      this.server.to(roomId).emit('consumerResumed', { consumerId });
      return {
        success: true,
        data: { isResumed: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(
    @MessageBody(new ZodValidationPipe(getRouterRtpCapabilitiesSchema))
    { roomId }: { roomId: string },
  ) {
    try {
      const routerRtpCapabilities =
        await this.roomService.getRouterRtpCapabilities(roomId);
      return {
        success: true,
        data: { routerRtpCapabilities },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('setPresenter')
  async setPresenter(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(setPresenterSchema))
    { roomId }: SetPresenterDto,
  ) {
    try {
      const existingPresenter = this.roomService.getPresenter(roomId);
      if (existingPresenter) {
        this.server.to(roomId).emit('presenterRemoved');
      }

      await this.roomService.setPresenter(roomId, client.id);
      this.server.to(roomId).emit('newPresenter', { peerId: client.id });

      return {
        success: true,
        data: { isPresenter: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }

  @SubscribeMessage('removePresenter')
  async removePresenter(
    @MessageBody(new ZodValidationPipe(removePresenterSchema))
    { roomId }: SetPresenterDto,
  ) {
    try {
      await this.roomService.removePresenter(roomId);
      this.server.to(roomId).emit('presenterRemoved');
      return {
        success: true,
        data: { isRemoved: true },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message ?? 'internal server error',
      };
    }
  }
}
