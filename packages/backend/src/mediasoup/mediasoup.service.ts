import { Injectable } from '@nestjs/common';
import { createWorker, types as MediasoupTypes } from 'mediasoup';

@Injectable()
export class MediasoupService {
  private worker: MediasoupTypes.Worker;

  constructor() {
    this.initWorker();
  }

  async initWorker() {
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
}
