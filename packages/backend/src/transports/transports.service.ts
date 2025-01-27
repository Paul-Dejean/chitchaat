import { Injectable } from '@nestjs/common';
import { RoomsService } from 'src/rooms/rooms.service';
import { types as MediasoupTypes } from 'mediasoup';

@Injectable()
export class TransportsService {
  constructor(private roomsService: RoomsService) {}

  async createWebRtcTransport(roomId: string, peerId: string) {
    const { listenIps, initialAvailableOutgoingBitrate } = {
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

  async connectTransport(
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
}
