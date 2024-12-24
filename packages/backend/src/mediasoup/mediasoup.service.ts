import { Injectable } from '@nestjs/common';
import { createWorker, types as MediasoupTypes } from 'mediasoup';
console.log(process.env);

@Injectable()
export class MediasoupService {
  private worker: MediasoupTypes.Worker;
  private router: MediasoupTypes.Router;
  private transports: MediasoupTypes.WebRtcTransport[] = [];

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

    this.router = await this.worker.createRouter({ mediaCodecs });
  }
  async createWebRtcTransport() {
    const { listenIps, initialAvailableOutgoingBitrate } = {
      listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
      initialAvailableOutgoingBitrate: 1000000,
    };

    console.log({ listenIps });

    const transport = await this.router.createWebRtcTransport({
      listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });

    console.log({ transport: transport.id });
    this.transports.push(transport);

    return transport;
  }

  async connect(
    transportId: string,
    dtlsParameters: MediasoupTypes.DtlsParameters,
  ) {
    const transport = this.getTransportById(transportId);

    if (!transport) {
      throw new Error('Transport not found');
    }

    await transport.connect({ dtlsParameters });
    console.log('transport connected', dtlsParameters);
  }

  async produce(
    transportId: string,
    kind: 'video' | 'audio',
    rtpParameters: MediasoupTypes.RtpParameters,
  ) {
    const transport = this.getTransportById(transportId);

    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    return producer;
  }

  async consume(
    consumerId: string,
    producerId: string,
    rtpCapabilities: MediasoupTypes.RtpCapabilities,
  ) {
    console.log({ transportIds: this.transports.map((t) => t.id) });
    const consumerTransport = this.getTransportById(consumerId);

    if (!consumerTransport) {
      throw new Error('Transport not found');
    }
    console.log('canConsume', {
      producerId,
      // rtpCapabilities,
      canConsume: this.router.canConsume({ producerId, rtpCapabilities }),
    });
    // console.log(this.router.rtpCapabilities);
    // console.log(rtpCapabilities);
    if (!this.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume');
    }

    console.log('Consuming', {
      producerId,
      rtpCapabilities,
      consumerTransport,
    });

    try {
      const consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start in paused state, resume after transport connect
      });

      setTimeout(async () => {
        await consumer.resume();
      }, 1000);

      return consumer;
    } catch (error) {
      console.error('consume failed', error);
    }
  }

  public async getRouterRtpCapabilities() {
    return this.router.rtpCapabilities;
  }
  private getTransportById(transportId: string) {
    return this.transports.find((transport) => transport.id === transportId);
  }
}
