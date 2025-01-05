// import { Device } from "mediasoup-client";
"use client";
import { Store } from "@/store";
import { roomActions } from "@/store/slices/room";
import {
  AppData,
  Consumer,
  detectDevice,
  Device,
  Producer,
  RtpCapabilities,
  Transport,
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
  private peerId: string | undefined;
  private roomId: string | undefined;
  private socket: Socket | undefined;
  private sendTransport: Transport<AppData> | undefined;
  private recvTransport: Transport<AppData> | undefined;

  private producers: Producer[] = [];
  public consumers: Consumer[] = [];

  constructor() {}

  reset() {
    this.state = RoomClientState.NEW;
    this.device = undefined;
    this.roomId = undefined;
    this.socket?.disconnect();
    this.socket = undefined;
    this.producers = [];
    this.consumers = [];
    this.sendTransport = undefined;
    this.recvTransport = undefined;
  }

  public setStore(store: Store) {
    this.store = store;
  }

  public close() {
    if (this.sendTransport) {
      this.sendTransport.close();
    }
    if (this.recvTransport) {
      this.recvTransport.close();
    }
    this.reset();
  }

  private initSocket() {
    const socket = io(process.env.NEXT_PUBLIC_API_URL);

    socket.on("connect", async () => {
      const { peerId } = (await this.emitMessage("joinRoom", {
        roomId: this.roomId,
      })) as { peerId: string };
      this.peerId = peerId;

      await this.initDevice();
      console.log("Connected to the server!");
    });

    socket.on("disconnect", () => {
      this.close();
      console.log("Disconnected from the server!");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on(
      "newProducer",
      async (peer: { producerId: string; peerId: string }) => {
        console.log({ newPeer: peer });
        if (
          this.consumers.find(
            (consumer) => consumer.producerId === peer.producerId
          )
        ) {
          return;
        }

        console.log("CONSUMING");
        const consumer = await this.consume(peer.producerId);
        console.log("dispatching addConsumer", { consumer });
        this.store.dispatch(
          roomActions.addConsumer({
            consumer: {
              id: consumer.id,
              track: consumer.track,
              peerId: peer.peerId,
            },
          })
        );
        console.log("RESUMING");
        await this.resumeConsumer(consumer.id);
      }
    );
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
    this.sendTransport = await this.createProducerTransport();
    this.recvTransport = await this.createConsumerTransport();
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

  async createProducer(track: MediaStreamTrack) {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    if (!this.sendTransport) {
      throw new Error("Send transport not instanciated");
    }

    try {
      const producer = await this.sendTransport.produce({ track });
      console.log({ producer });
      this.producers.push(producer);
      return producer;
    } catch (error) {
      console.error("Failed to produce", error);
    }
  }

  //   async closeProducer() {
  //     await this.producer.close();
  //     this.producer = undefined;
  //   }

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
            peerId: this.peerId,
          },
          ({ producerId }: { producerId: string }) => {
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
    if (!this.recvTransport) {
      throw new Error("Recv transport not instanciated");
    }

    const { kind, rtpParameters, id } = await this.emitMessage("consume", {
      roomId: this.roomId,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      consumerId: this.recvTransport.id,
    });

    const consumer = await this.recvTransport.consume({
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
