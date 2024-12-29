// import { Device } from "mediasoup-client";
"use client";
import { Device, RtpCapabilities, Transport } from "mediasoup-client/lib/types";
import { detectDevice } from "mediasoup-client";

import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

export class MediasoupClient {
  private device: Device;
  private socket: Socket;
  private producerTransport: Transport | null = null;
  private consumerTransports: Transport[] = [];

  constructor() {
    if (typeof window === "undefined") {
      throw new Error("MediasoupClient must be instantiated in the browser");
    }

    const handlerName = detectDevice();

    if (handlerName) {
      console.log("detected handler: %s", handlerName);
    } else {
      throw new Error("Unsupported device");
    }

    this.device = new Device({ handlerName });
    this.socket = getSocket();
  }

  async loadDevice(routerRtpCapabilities: RtpCapabilities) {
    if (!this.device.loaded) {
      await this.device.load({ routerRtpCapabilities });
      console.log("Mediasoup device loaded");
    }
  }

  async createProducerTransport(roomId: string) {
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage("createTransport", { roomId });

    const producerTransport = this.device.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    producerTransport.on("connect", async ({ dtlsParameters }, callback) => {
      await this.socket.emit("connectTransport", {
        roomId,
        transportId: producerTransport.id,
        dtlsParameters: dtlsParameters,
      });
      callback();
    });
    producerTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback) => {
        this.socket.emit(
          "produce",
          {
            roomId,
            transportId: this.producerTransport!.id,
            kind,
            rtpParameters,
          },
          (producerId: string) => {
            callback({ id: producerId });
          }
        );
      }
    );
    this.producerTransport = producerTransport;
    return producerTransport;
  }

  async createConsumerTransport(roomId: string) {
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage("createTransport", { roomId });

    const consumerTransport = this.device.createRecvTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    consumerTransport.on("connect", async ({ dtlsParameters }, callback) => {
      console.log("Connecting transport...", {
        transportId: consumerTransport.id,
        dtlsParameters,
      });
      await this.socket.emit("connectTransport", {
        roomId,
        transportId: consumerTransport.id,
        dtlsParameters: dtlsParameters,
      });
      callback();
    });

    this.consumerTransports.push(consumerTransport);
    return consumerTransport;
  }

  async consume(
    roomId: string,
    producerId: string,
    consumerTransport: Transport
  ) {
    const { kind, rtpParameters, id } = await this.emitMessage("consume", {
      roomId,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      consumerId: consumerTransport.id,
    });

    const consumer = await consumerTransport.consume({
      id,
      producerId: this.producerTransport!.id,
      kind,
      rtpParameters,
    });

    return consumer;
  }

  async getRoomProducers(roomId: string) {
    const producers = await this.emitMessage("getRoomProducers", { roomId });
    return producers;
  }

  async emitMessage<T = unknown>(type: string, data = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      this.socket.emit(type, data, (response: T) => {
        if (
          typeof response === "object" &&
          response !== null &&
          "error" in response &&
          response.error
        ) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

export const mediasoupClient = new MediasoupClient();
