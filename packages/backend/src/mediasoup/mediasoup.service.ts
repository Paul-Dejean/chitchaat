import { Injectable } from '@nestjs/common';
import { createWorker, types as MediasoupTypes } from 'mediasoup';
import { RoomsService } from 'src/rooms/rooms.service';

@Injectable()
export class MediasoupService {
  private worker: MediasoupTypes.Worker;

  constructor(private roomsService: RoomsService) {
    this.initMediasoup();
  }

  async initMediasoup() {
    this.worker = await createWorker({
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'debug',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    });

    this.worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds...');
      setTimeout(() => process.exit(1), 2000);
    });
  }

  async createRouter() {
    const mediaCodecs: MediasoupTypes.RtpCodecCapability[] = [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
    ];
    const router = await this.worker.createRouter({ mediaCodecs });
    return router;
  }
  async createWebRtcTransport(roomId: string, peerId: string) {
    console.log({
      MEDIASOUP_V4: process.env.MEDIASOUP_ANNOUNCED_IP_V4,
      MEDIASOUP_V6: process.env.MEDIASOUP_ANNOUNCED_IP_V6,
    });
    const { listenIps, initialAvailableOutgoingBitrate } = {
      //listenIps: [{ ip: '0.0.0.0', announcedIp: '51.44.122.113' }],
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP_V4 ?? '127.0.0.1',
        },
        {
          // For IPv6
          ip: '::', // Listens on all IPv6 addresses
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP_V6 ?? '::1', // Optionally specify the public IPv6 address
        },
      ],
      initialAvailableOutgoingBitrate: 1000000,
    };

    const room = await this.roomsService.getRoomById(roomId);

    const transport = await room.router.createWebRtcTransport({
      listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });

    this.roomsService.addTransport(roomId, peerId, transport);
    return transport;
  }

  async connect(
    roomId,
    transportId: string,
    dtlsParameters: MediasoupTypes.DtlsParameters,
  ) {
    const transport = await this.roomsService.getTransportById(
      roomId,
      transportId,
    );

    if (!transport) {
      throw new Error('Transport not found');
    }

    await transport.connect({ dtlsParameters });
    console.log('transport connected', dtlsParameters);
  }

  async produce({
    peerId,
    roomId,
    transportId,
    kind,
    rtpParameters,
  }: {
    peerId: string;
    roomId: string;
    transportId: string;
    kind: 'video' | 'audio';
    rtpParameters: MediasoupTypes.RtpParameters;
  }) {
    const transport = await this.roomsService.getTransportById(
      roomId,
      transportId,
    );

    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    this.roomsService.addProducer(roomId, peerId, producer);

    return producer;
  }

  async consume({
    consumerId,
    peerId,
    producerId,
    roomId,
    rtpCapabilities,
  }: {
    peerId: string;
    roomId: string;
    consumerId: string;
    producerId: string;
    rtpCapabilities: MediasoupTypes.RtpCapabilities;
  }) {
    const consumerTransport = await this.roomsService.getTransportById(
      roomId,
      consumerId,
    );

    if (!consumerTransport) {
      throw new Error('Transport not found');
    }

    const room = await this.roomsService.getRoomById(roomId);

    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume');
    }

    try {
      const consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start in paused state, resume after transport connect
      });

      consumer.on('transportclose', () => {
        this.roomsService.deleteConsumer(roomId, peerId, consumer.id);
      });

      consumer.on('producerclose', () => {
        this.roomsService.deleteConsumer(roomId, peerId, consumer.id);
      });

      this.roomsService.addConsumer(roomId, peerId, consumer);

      return consumer;
    } catch (error) {
      console.error('consume failed', error);
    }
  }

  async resumeConsumer(roomId: string, consumerId: string) {
    console.log({ roomId, consumerId });
    const consumer = this.roomsService.getConsumerById(roomId, consumerId);
    console.log({ hello: consumer });
    await consumer.resume();
  }

  async pauseProducer(roomId: string, producerId: string) {
    const producer = this.roomsService.getProducerById(roomId, producerId);
    await producer.pause();
  }

  async resumeProducer(roomId: string, producerId: string) {
    const producer = this.roomsService.getProducerById(roomId, producerId);
    await producer.resume();
  }

  async closeProducer(roomId: string, producerId: string) {
    const producer = this.roomsService.getProducerById(roomId, producerId);
    await producer.close();
  }
  public async getRouterRtpCapabilities(roomId: string) {
    const room = await this.roomsService.getRoomById(roomId);
    return room.router.rtpCapabilities;
  }
}
