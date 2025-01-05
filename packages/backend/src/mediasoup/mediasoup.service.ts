import { Injectable } from '@nestjs/common';
import { createWorker, types as MediasoupTypes } from 'mediasoup';

@Injectable()
export class MediasoupService {
  private worker: MediasoupTypes.Worker;

  private transports: Map<string, MediasoupTypes.WebRtcTransport[]> = new Map();
  private producers: Map<string, MediasoupTypes.Producer[]> = new Map();
  private consumers: Map<string, MediasoupTypes.Consumer[]> = new Map();
  private routers: Map<string, MediasoupTypes.Router> = new Map();

  constructor() {
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

  async createRouter(roomId: string) {
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
    this.routers.set(roomId, router);
    return router;
  }
  async createWebRtcTransport(roomId: string) {
    const { listenIps, initialAvailableOutgoingBitrate } = {
      listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
      initialAvailableOutgoingBitrate: 1000000,
    };

    const router = this.routers.get(roomId);
    console.log(this.routers);

    const transport = await router.createWebRtcTransport({
      listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });

    if (!this.transports.has(roomId)) {
      this.transports.set(roomId, []);
    }

    this.transports.get(roomId).push(transport);
    return transport;
  }

  async connect(
    roomId,
    transportId: string,
    dtlsParameters: MediasoupTypes.DtlsParameters,
  ) {
    const transport = this.getTransportById(roomId, transportId);

    if (!transport) {
      throw new Error('Transport not found');
    }

    await transport.connect({ dtlsParameters });
    console.log('transport connected', dtlsParameters);
  }

  async produce(
    roomId: string,
    transportId: string,
    kind: 'video' | 'audio',
    rtpParameters: MediasoupTypes.RtpParameters,
    peerId: string,
  ) {
    const transport = this.getTransportById(roomId, transportId);

    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    if (!this.producers.has(roomId)) {
      this.producers.set(roomId, []);
    }

    this.producers.get(roomId).push(producer);

    console.log({ producers: this.producers });

    return producer;
  }

  async consume(
    roomId: string,
    consumerId: string,
    producerId: string,
    rtpCapabilities: MediasoupTypes.RtpCapabilities,
  ) {
    const consumerTransport = this.getTransportById(roomId, consumerId);

    if (!consumerTransport) {
      throw new Error('Transport not found');
    }

    if (!this.routers.get(roomId).canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume');
    }

    try {
      const consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start in paused state, resume after transport connect
      });

      if (!this.consumers.has(roomId)) {
        this.consumers.set(roomId, []);
      }

      this.consumers.get(roomId).push(consumer);

      return consumer;
    } catch (error) {
      console.error('consume failed', error);
    }
  }

  async resumeConsumer(roomId: string, consumerId: string) {
    const consumer = this.consumers
      .get(roomId)
      .find((roomConsumer) => roomConsumer.id === consumerId);
    await consumer.resume();
  }

  public async getRouterRtpCapabilities(roomId: string) {
    return this.routers.get(roomId).rtpCapabilities;
  }

  private getTransportById(roomId: string, transportId: string) {
    return this.transports
      .get(roomId)
      .find((transport) => transport.id === transportId);
  }
}
