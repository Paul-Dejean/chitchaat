import { Injectable } from '@nestjs/common';
import { RoomsService } from '@/rooms/rooms.service';
import { types as MediasoupTypes } from 'mediasoup';
import { ClientsService } from '@/clients/clients.service';
import { SctpCapabilities } from 'mediasoup/node/lib/types';

@Injectable()
export class TransportsService {
  constructor(
    private roomsService: RoomsService,
    private clientsService: ClientsService,
  ) {}

  async createWebRtcTransport(
    roomId: string,
    peerId: string,
    sctpCapabilites?: SctpCapabilities,
  ) {
    const listenInfos: MediasoupTypes.TransportListenInfo[] = [
      {
        ip: '::',
        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IPV6_ADDRESS ?? '::1',
        protocol: 'udp' as const,
      },
      {
        ip: '::',
        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IPV6_ADDRESS ?? '::1',
        protocol: 'tcp' as const,
      },
      {
        ip: '0.0.0.0',
        announcedAddress:
          process.env.MEDIASOUP_ANNOUNCED_IPV4_ADDRESS ?? '127.0.0.1',
        protocol: 'udp' as const,
      },
      {
        ip: '0.0.0.0',
        announcedAddress:
          process.env.MEDIASOUP_ANNOUNCED_IPV4_ADDRESS ?? '127.0.0.1',
        protocol: 'tcp' as const,
      },
    ];

    const initialAvailableOutgoingBitrate = 1000000;

    const room = await this.roomsService.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    console.log({
      listenInfos,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
      enableSctp: !!sctpCapabilites,
      numSctpStreams: sctpCapabilites?.numStreams,
    });

    try {
      const transport = await room.router.createWebRtcTransport({
        listenInfos,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate,
        enableSctp: !!sctpCapabilites,
        numSctpStreams: sctpCapabilites?.numStreams,
      });
      console.log({ transport });

      const client = this.clientsService.getClientById(peerId);
      if (!client) {
        throw new Error('Client not found');
      }

      transport.on('icestatechange', (iceState) => {
        if (iceState === 'disconnected' || iceState === 'closed') {
          client.disconnect();
          console.log('iceStateChange failed - client deconnected', iceState);
        }
      });

      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'failed' || dtlsState === 'closed') {
          client.disconnect();
          console.log('dtlsStateChange failed - client deconnected', dtlsState);
        }
      });

      this.roomsService.addTransport(roomId, peerId, transport);
      return transport;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async connectTransport(
    roomId: string,
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
  }
}
