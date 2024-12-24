// import { Device } from "mediasoup-client";
"use client";
import { Device, RtpCapabilities, Transport } from "mediasoup-client/lib/types";
import { detectDevice } from "mediasoup-client";

import { Socket, io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001"; // Update to your server's URL

export class MediasoupClient {
  private device: Device;
  private socket: Socket;
  private producerTransport: Transport | null;
  private consumerTransport: Transport | null;
  private producerId: string | null;

  constructor() {
    console.log(typeof window);
    if (typeof window === "undefined") {
      return;
    }
    console.log("init");
    const handlerName = detectDevice();
    console.log({ handlerName });
    if (handlerName) {
      console.log("detected handler: %s", handlerName);
    } else {
      console.warn("no suitable handler found for current browser/device");
      return;
    }

    console.log({ handlerName });
    try {
      this.device = new Device({ handlerName });
    } catch (error) {
      console.error("Failed to create mediasoup Device:", error);
      return;
    }

    this.socket = io(SERVER_URL);
    console.log(this.socket);
    this.socket.on("connect", () => {
      console.log("Connected to the server!");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
    this.producerTransport = null;
  }

  async loadDevice(routerRtpCapabilities: RtpCapabilities) {
    console.log("Loading device");
    console.log([this.device]);
    if (!this.device.loaded) {
      await this.device.load({ routerRtpCapabilities });
      console.log("Mediasoup device loaded");
    }
  }

  async createProducerTransport() {
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage("createTransport");
    console.log("createProducerTransport", {
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });
    this.producerTransport = this.device.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    // console.log({ producer: this.producerTransport });

    // console.log(this.producerTransport, { id: this.producerTransport!.id });
    // this.socket.emit(
    //   "connectTransport",
    //   { transportId: this.producerTransport!.id, dtlsParameters },
    //   (response: any) => {
    //     console.log({ response });
    //     if (response.error) {
    //       console.error("Transport connection failed:", response.error);
    //       // Optionally call a failure handling function here
    //     } else {
    //       console.log("Transport connected successfully");
    //     }
    //   }
    // );
    this.producerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback) => {
        console.log("Connecting transport...", {
          transportId: this.producerTransport!.id,
          dtlsParameters,
        });
        await this.socket.emit("connectTransport", {
          transportId: this.producerTransport!.id,
          dtlsParameters: dtlsParameters,
        });
        callback();
        console.log(this.producerTransport?.connectionState);
      }
    );
    this.producerTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback) => {
        console.log("producing");
        console.log(this.producerTransport?.connectionState);
        this.socket.emit(
          "produce",
          { transportId: this.producerTransport!.id, kind, rtpParameters },
          (producerId: string) => {
            console.log({ producerId });
            // if (error) {
            //   console.log("Error producing:", error);
            //   errback(error);
            //   return;
            // }
            this.producerId = producerId;
            console.log({ id: producerId });
            callback({ id: producerId });
          }
        );
      }
    );
    return this.producerTransport;
  }

  async createConsumerTransport() {
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage("createTransport");

    console.log({ id, iceParameters, iceCandidates, dtlsParameters });
    this.consumerTransport = this.device.createRecvTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    console.log({ consumer: this.consumerTransport });

    this.consumerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback) => {
        console.log("Connecting transport...", {
          transportId: this.consumerTransport!.id,
          dtlsParameters,
        });
        await this.socket.emit("connectTransport", {
          transportId: this.consumerTransport!.id,
          dtlsParameters: dtlsParameters,
        });
        callback();
      }
    );

    return this.consumerTransport;
  }

  async consume() {
    if (!this.consumerTransport) {
      await this.createConsumerTransport();
    }

    console.log("Consuming");
    const { kind, rtpParameters, id } = await this.emitMessage("consume", {
      producerId: this.producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      consumerId: this.consumerTransport!.id,
    });

    console.log({ kind, rtpParameters, id });

    // const consumer = await this.consumerTransport!.consume({
    //   id,
    //   producerId,
    //   kind,
    //   rtpParameters,
    // });

    // return consumer;
    const consumer = await this.consumerTransport!.consume({
      id,
      producerId: this.producerTransport!.id,
      kind,
      rtpParameters,
    });
    console.log("Created consumer:", consumer);
    return consumer;
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
