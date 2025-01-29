import { detectDevice, Device } from "mediasoup-client";
import {
  DtlsParameters,
  IceCandidate,
  IceParameters,
  RtpCapabilities,
  RtpParameters,
  SctpParameters,
  SctpStreamParameters,
  Transport,
} from "mediasoup-client/lib/types";
import { WsClient } from "./WsClient";

type TransportConnection = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  sctpParameters: SctpParameters;
};

export class MediasoupClient {
  device: Device | null = null;
  recvTransport: Transport | null = null;
  sendTransport: Transport | null = null;
  roomId: string | null = null;

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
      return null;
    }
  }

  public async initTransports() {
    this.sendTransport = await this.createProducerTransport();
    this.recvTransport = await this.createConsumerTransport();
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

  public async createDataProducer() {
    if (!this.sendTransport) {
      throw new Error("sendTransport not instanciated");
    }
    const dataProducer = await this.sendTransport.produceData({
      ordered: false,
      maxRetransmits: 1,
      label: "chat",
      appData: { info: "my-chat-DataProducer" },
    });
    return dataProducer;
  }

  public async createDataConsumer({
    dataProducerId,
  }: {
    dataProducerId: string;
  }) {
    if (!this.recvTransport) {
      throw new Error("recvTransport not instanciated");
    }
    const { dataConsumerId, sctpStreamParameters } =
      await this.wsClient.emitMessage<{
        dataConsumerId: string;
        sctpStreamParameters: SctpStreamParameters;
      }>("createDataConsumer", {
        roomId: this.roomId,
        dataProducerId,
        transportId: this.recvTransport.id,
      });

    console.log({ dataConsumerId, sctpStreamParameters });

    const dataConsumer = await this.recvTransport.consumeData({
      id: dataConsumerId,
      dataProducerId,
      sctpStreamParameters,
    });

    return dataConsumer;
  }

  private async createProducerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }

    if (!this.roomId) {
      throw new Error("RoomId not set");
    }

    const { id, iceParameters, iceCandidates, dtlsParameters, sctpParameters } =
      await this.wsClient.emitMessage<TransportConnection>("createTransport", {
        roomId: this.roomId,
        sctpCapabilities: this.device.sctpCapabilities,
      });

    console.log({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
      sctpParameters,
    });

    const producerTransport = this.device.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
      sctpParameters,
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

    producerTransport.on(
      "producedata",
      async ({ sctpStreamParameters }, callback) => {
        const { dataProducerId } = await this.wsClient.emitMessage<{
          dataProducerId: string;
        }>("createDataProducer", {
          roomId: this.roomId,
          transportId: producerTransport.id,
          sctpStreamParameters,
        });
        callback({ id: dataProducerId });
      }
    );

    return producerTransport;
  }

  private async createConsumerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    const { id, iceParameters, iceCandidates, dtlsParameters, sctpParameters } =
      await this.wsClient.emitMessage<TransportConnection>("createTransport", {
        roomId: this.roomId,
        sctpCapabilities: this.device.sctpCapabilities,
      });

    const consumerTransport = this.device.createRecvTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
      sctpParameters,
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
