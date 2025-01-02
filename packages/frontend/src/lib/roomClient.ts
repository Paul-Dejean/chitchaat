// import { Device } from "mediasoup-client";
"use client";
import { Store } from "@/store";
import { roomActions } from "@/store/slices/room";
import {
  Consumer,
  detectDevice,
  Device,
  Producer,
  RtpCapabilities,
} from "mediasoup-client/lib/types";
import { io, Socket } from "socket.io-client";

export enum RoomClientState {
  NEW = "NEW",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  CLOSED = "CLOSED",
}

export class RoomClient {
  private store: Store;
  state: RoomClientState = RoomClientState.NEW;
  private device: Device | undefined;
  private roomId: string | undefined;
  private socket: Socket | undefined;

  private producer: Producer | undefined;
  public consumers: Consumer[] = [];

  constructor() {}

  reset() {
    this.state = RoomClientState.NEW;
    this.device = undefined;
    this.roomId = undefined;
    this.socket?.disconnect();
    this.socket = undefined;
    this.producer = undefined;
    this.consumers = [];
  }

  public setStore(store: Store) {
    this.store = store;
  }

  private initSocket() {
    const socket = io(process.env.NEXT_PUBLIC_API_URL);

    socket.on("connect", () => {
      //   this.emitMessage("joinRoom", { roomId: this.roomId });
      this.initDevice();
      console.log("Connected to the server!");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from the server!");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("newPeer", async (peer: { producerId: string }) => {
      console.log({ newPeer: peer });
      if (
        this.consumers.find(
          (consumer) => consumer.producerId === peer.producerId
        )
      ) {
        return;
      }
      const consumer = await this.consume(peer.producerId);
      await this.resumeConsumer(consumer.id);
    });
    return socket;
  }

  joinRoom(roomId: string) {
    this.state = RoomClientState.CONNECTING;
    this.store.dispatch(roomActions.updateState(RoomClientState.CONNECTING));
    this.roomId = roomId;
    this.socket = this.initSocket();
  }

  private async initDevice() {
    const handlerName = detectDevice();
    this.device = new Device({ handlerName });
    const { routerRtpCapabilities } = await this.emitMessage<{
      routerRtpCapabilities: RtpCapabilities;
    }>("getRouterRtpCapabilities", { roomId: this.roomId });
    await this.loadDevice(routerRtpCapabilities);
    this.state = RoomClientState.CONNECTED;
    this.store.dispatch(roomActions.updateState(RoomClientState.CONNECTED));
    console.log("new State", this.state);
  }

  private async loadDevice(routerRtpCapabilities: RtpCapabilities) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    if (!this.device.loaded) {
      await this.device.load({ routerRtpCapabilities });
      console.log("Mediasoup device loaded");
    }
  }

  async createProducer(stream: MediaStream) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }

    const transport = await this.createProducerTransport();
    const track = stream.getVideoTracks()[0];
    try {
      const producer = await transport.produce({ track });
      console.log({ producer });
      this.producer = producer;
      return producer;
    } catch (error) {
      console.error("Failed to produce", error);
    }
  }

  private async createProducerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }

    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage("createTransport", { roomId: this.roomId });

    const producerTransport = this.device.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
    });

    producerTransport.on("connect", async ({ dtlsParameters }, callback) => {
      if (!this.socket) {
        throw new Error("Socket not instanciated");
      }
      await this.socket.emit("connectTransport", {
        roomId: this.roomId,
        transportId: producerTransport.id,
        dtlsParameters: dtlsParameters,
      });
      callback();
    });
    producerTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback) => {
        if (!this.socket) {
          throw new Error("Socket not instanciated");
        }
        this.socket.emit(
          "produce",
          {
            roomId: this.roomId,
            transportId: producerTransport!.id,
            kind,
            rtpParameters,
          },
          (producerId: string) => {
            callback({ id: producerId });
          }
        );
      }
    );

    return producerTransport;
  }

  async consume(producerId: string) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }

    const consumerTransport = await this.createConsumerTransport();
    const { kind, rtpParameters, id } = await this.emitMessage("consume", {
      roomId: this.roomId,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      consumerId: consumerTransport.id,
    });

    const consumer = await consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
    });

    this.consumers = [...this.consumers, consumer];
    console.log({ "this.consumers": this.consumers });

    return consumer;
  }

  private async createConsumerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage("createTransport", { roomId: this.roomId });

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
      if (!this.socket) {
        throw new Error("Socket not instanciated");
      }
      await this.socket.emit("connectTransport", {
        roomId: this.roomId,
        transportId: consumerTransport.id,
        dtlsParameters: dtlsParameters,
      });
      callback();
    });

    return consumerTransport;
  }

  async resumeConsumer(consumerId: string) {
    console.log("resuming", consumerId);
    await this.emitMessage("resumeConsumer", {
      roomId: this.roomId,
      consumerId: consumerId,
    });
  }

  private async emitMessage<T = unknown>(type: string, data = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        throw new Error("Socket not instanciated");
      }
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
