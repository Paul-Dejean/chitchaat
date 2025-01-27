import { detectDevice, Device } from "mediasoup-client";
import {
  DtlsParameters,
  IceCandidate,
  IceParameters,
  RtpCapabilities,
  RtpParameters,
  Transport,
} from "mediasoup-client/lib/types";
import { WsClient } from "./WsClient";

type TransportConnection = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};

export class MediasoupClient {
  device: Device | undefined;
  recvTransport: Transport | undefined;
  sendTransport: Transport | undefined;

  roomId: string | undefined;
  constructor(private wsClient: WsClient) {}

  async initDevice(roomId: string) {
    this.roomId = roomId;
    const handlerName = detectDevice();
    this.device = new Device({ handlerName });
    const { routerRtpCapabilities } = await this.wsClient.emitMessage<{
      routerRtpCapabilities: RtpCapabilities;
    }>("getRouterRtpCapabilities", { roomId });

    await this.loadDevice(routerRtpCapabilities);
  }

  private async loadDevice(routerRtpCapabilities: RtpCapabilities) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    if (!this.device.loaded) {
      await this.device.load({ routerRtpCapabilities });
    }
  }

  public async createConsumer(producerId: string) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    if (!this.roomId) {
      throw new Error("RoomId not set");
    }
    if (!this.recvTransport) {
      throw new Error("Recv transport not instanciated");
    }

    const { kind, rtpParameters, id } = await this.wsClient.emitMessage<{
      kind: "video" | "audio";
      rtpParameters: RtpParameters;
      id: string;
    }>("createConsumer", {
      roomId: this.roomId,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      consumerId: this.recvTransport.id,
    });

    console.log({ kind, rtpParameters, id });

    const consumer = await this.recvTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
    });

    return consumer;
  }

  public async createProducer(track: MediaStreamTrack) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    if (!this.sendTransport) {
      throw new Error("Send transport not instanciated");
    }

    try {
      const producer = await this.sendTransport.produce({ track });
      console.log({ producer });

      return producer;
    } catch (error) {
      console.error("Failed to produce", error);
    }
  }

  public async initTransports() {
    this.recvTransport = await this.createConsumerTransport();
    this.sendTransport = await this.createProducerTransport();
  }

  public async closeProducer(producerId: string) {
    await this.wsClient.emitMessage("closeProducer", {
      roomId: this.roomId,
      producerId: producerId,
    });
  }

  public async resumeProducer(producerId: string) {
    await this.wsClient.emitMessage("resumeProducer", {
      roomId: this.roomId,
      producerId: producerId,
    });
  }

  public async pauseProducer(producerId: string) {
    await this.wsClient.emitMessage("pauseProducer", {
      roomId: this.roomId,
      producerId: producerId,
    });
  }

  public async resumeConsumer(consumerId: string) {
    await this.wsClient.emitMessage("resumeConsumer", {
      roomId: this.roomId,
      consumerId: consumerId,
    });
  }

  public getRtpCapabilities() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    return this.device.rtpCapabilities;
  }

  public closeTransports() {
    this.recvTransport?.close();
    this.sendTransport?.close();
  }

  private async createProducerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }

    if (!this.roomId) {
      throw new Error("RoomId not set");
    }

    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.wsClient.emitMessage<TransportConnection>("createTransport", {
        roomId: this.roomId,
      });

    const producerTransport = this.device.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    producerTransport.on("connect", async ({ dtlsParameters }, callback) => {
      await this.wsClient.emitMessage("connectTransport", {
        roomId: this.roomId,
        transportId: producerTransport.id,
        dtlsParameters: dtlsParameters,
      });

      callback();
    });
    producerTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback) => {
        const { producerId } = await this.wsClient.emitMessage<{
          producerId: string;
        }>("createProducer", {
          roomId: this.roomId,
          transportId: producerTransport.id,
          kind,
          rtpParameters,
        });
        callback({ id: producerId });
      }
    );

    return producerTransport;
  }

  private async createConsumerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.wsClient.emitMessage<TransportConnection>("createTransport", {
        roomId: this.roomId,
      });

    const consumerTransport = this.device.createRecvTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    consumerTransport.on("connect", async ({ dtlsParameters }, callback) => {
      await this.wsClient.emitMessage("connectTransport", {
        roomId: this.roomId,
        transportId: consumerTransport.id,
        dtlsParameters: dtlsParameters,
      });
      callback();
    });

    return consumerTransport;
  }
}
