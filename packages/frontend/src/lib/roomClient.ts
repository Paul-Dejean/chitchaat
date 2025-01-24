// import { Device } from "mediasoup-client";
"use client";
import { Store } from "@/store";
import { roomActions } from "@/store/slices/room";
import {
  AppData,
  Consumer,
  detectDevice,
  Device,
  DtlsParameters,
  IceCandidate,
  IceParameters,
  Producer,
  RtpCapabilities,
  RtpParameters,
  Transport,
} from "mediasoup-client/lib/types";
import { io, Socket } from "socket.io-client";

export enum RoomClientState {
  NEW = "NEW",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  CLOSED = "CLOSED",
}

type TransportConnection = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};
export class RoomClient {
  private store: Store;
  state: RoomClientState = RoomClientState.NEW;
  private device: Device | undefined;
  private roomId: string | undefined;
  private socket: Socket | undefined;
  private sendTransport: Transport<AppData> | undefined;
  private recvTransport: Transport<AppData> | undefined;

  private microphoneProducer: Producer | undefined;
  private videoProducer: Producer | undefined;
  private desktopProducer: Producer | undefined;
  public consumers: Consumer[] = [];

  constructor({ store }: { store: Store }) {
    this.store = store;
  }

  public setStore(store: Store) {
    this.store = store;
  }

  private reset() {
    this.state = RoomClientState.NEW;
    this.device = undefined;
    this.roomId = undefined;
    this.socket?.disconnect();
    this.socket = undefined;

    this.consumers = [];
    this.sendTransport = undefined;
    this.recvTransport = undefined;
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
    console.log({ socket });

    socket.on("connect", async () => {
      const room = (await this.emitMessage("joinRoom", {
        roomId: this.roomId,
      })) as {
        peers: { id: string; displayName: string; producers: Producer[] }[];
      };
      console.log({ room });

      await this.initDevice();

      console.log("Consuming existing peers");
      console.log({ peers: room.peers });

      for (const peer of room.peers) {
        console.log({ peerId: peer.id, displayName: peer.displayName });
        this.store.dispatch(
          roomActions.addPeer({
            id: peer.id,
            displayName: peer.displayName,
            consumers: [],
            isMe: peer.id === socket.id,
          })
        );
        if (peer.id !== socket.id) {
          for (const producer of peer.producers) {
            console.log(producer);
            const consumer = await this.consume(producer.id);
            console.log({
              consumer,
              consumerId: consumer.id,
              track: consumer.track,
              peerId: peer.id,
              isPaused: consumer.paused,
            });
            this.store.dispatch(
              roomActions.addConsumer({
                consumer: {
                  id: consumer.id,
                  track: consumer.track,
                  peerId: peer.id,
                  isPaused: consumer.paused,
                },
              })
            );
            console.log("RESUMING consumer");
            await this.resumeConsumer(consumer.id);
            this.store.dispatch(
              roomActions.resumeConsumer({ consumerId: consumer.id })
            );
          }
        }
      }

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
        if (!this.socket) return;
        if (this.socket.id === peer.peerId) return;
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
              isPaused: consumer.paused,
            },
          })
        );

        console.log("RESUMING");
        await this.resumeConsumer(consumer.id);
        this.store.dispatch(
          roomActions.resumeConsumer({ consumerId: consumer.id })
        );
      }
    );
    socket.on("consumerClosed", ({ consumerId }) => {
      console.log("consumerClosed", { consumerId });
      const consumer = this.consumers.find(
        (consumer) => consumer.id === consumerId
      );
      consumer?.close();
      console.log(this.consumers);
      this.store.dispatch(roomActions.removeConsumer({ consumerId }));
    });

    socket.on("consumerPaused", ({ consumerId }) => {
      const consumer = this.consumers.find(
        (consumer) => consumer.id === consumerId
      );
      consumer?.pause();
      this.store.dispatch(roomActions.pauseConsumer({ consumerId }));
    });

    socket.on("consumerResumed", ({ consumerId }) => {
      console.log("consumer RESUMED", { consumerId });
      const consumer = this.consumers.find(
        (consumer) => consumer.id === consumerId
      );
      consumer?.resume();
      this.store.dispatch(roomActions.resumeConsumer({ consumerId }));
    });

    socket.on(
      "newPeer",
      async (newPeer: { id: string; displayName: string }) => {
        console.log("newPeer", { newPeer });
        this.store.dispatch(
          roomActions.addPeer({
            ...newPeer,
            consumers: [],
            isMe: newPeer.id === socket.id,
          })
        );
      }
    );

    socket.on("peerClosed", async ({ peerId }: { peerId: string }) => {
      console.log("peerClosed", { peerId });
      this.store.dispatch(roomActions.removePeer({ peerId }));
    });

    return socket;
  }

  joinRoom(roomId: string) {
    this.state = RoomClientState.CONNECTING;
    this.store.dispatch(roomActions.updateState(RoomClientState.CONNECTING));
    this.roomId = roomId;
    this.socket = this.initSocket();
    console.log("joining room", this.socket);
  }

  leaveRoom() {
    console.log("disconnecting", this.socket);
    this.socket?.disconnect();
    this.close();
    this.store.dispatch(roomActions.leaveRoom());
  }

  private async initDevice() {
    const handlerName = detectDevice();
    this.device = new Device({ handlerName });
    console.log({ device: this.device });
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

  async enableWebcam() {
    if (this.desktopProducer) {
      await this.disableScreenSharing();
    }
    if (this.videoProducer) {
      await this.socket?.emit("resumeProducer", {
        roomId: this.roomId,
        producerId: this.videoProducer.id,
      });
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const track = stream.getVideoTracks()[0];
      this.videoProducer = await this.createProducer(track);
    }
  }

  async disableWebcam() {
    if (this.videoProducer) {
      this.videoProducer.close();
      await this.socket?.emit("closeProducer", {
        roomId: this.roomId,
        producerId: this.videoProducer.id,
      });

      this.videoProducer = undefined;
    }
  }

  async enableScreenSharing() {
    if (this.videoProducer) {
      await this.disableWebcam();
    }
    if (this.desktopProducer) {
      await this.socket?.emit("resumeProducer", {
        roomId: this.roomId,
        producerId: this.desktopProducer.id,
      });
    } else {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const track = stream.getVideoTracks()[0];
      this.desktopProducer = await this.createProducer(track);
      this.desktopProducer?.on("trackended", () => this.disableScreenSharing());
      return track;
    }
  }

  async disableScreenSharing() {
    if (this.desktopProducer) {
      this.desktopProducer.close();
      await this.socket?.emit("closeProducer", {
        roomId: this.roomId,
        producerId: this.desktopProducer.id,
      });

      this.desktopProducer = undefined;
    }
  }

  async enableMicrophone() {
    if (this.microphoneProducer) {
      await this.socket?.emit("resumeProducer", {
        roomId: this.roomId,
        producerId: this.microphoneProducer.id,
      });
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      this.microphoneProducer = await this.createProducer(track);
    }
  }

  async disableMicrophone() {
    if (this.microphoneProducer) {
      await this.socket?.emit("pauseProducer", {
        roomId: this.roomId,
        producerId: this.microphoneProducer.id,
      });
    }
  }

  private async createProducer(track: MediaStreamTrack) {
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

  //   async closeProducer() {
  //     await this.producer.close();
  //     this.producer = undefined;
  //   }

  private async createProducerTransport() {
    console.log("creating send Producer transport");
    if (!this.device) {
      throw new Error("Device not instanciated");
    }

    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage<TransportConnection>("createTransport", {
        roomId: this.roomId,
      });

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
          ({ producerId }: { producerId: string }) => {
            callback({ id: producerId });
          }
        );
      }
    );

    console.log({ producerTransport });

    return producerTransport;
  }

  async consume(producerId: string) {
    console.log("consuming", producerId);
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    if (!this.recvTransport) {
      throw new Error("Recv transport not instanciated");
    }

    const { kind, rtpParameters, id } = await this.emitMessage<{
      kind: "video" | "audio";
      rtpParameters: RtpParameters;
      id: string;
    }>("consume", {
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

    this.consumers = [...this.consumers, consumer];
    console.log({ "this.consumers": this.consumers });

    return consumer;
  }

  private async createConsumerTransport() {
    if (!this.device) {
      throw new Error("Device not instanciated");
    }
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.emitMessage<TransportConnection>("createTransport", {
        roomId: this.roomId,
      });

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
    console.log("resuming", consumerId, this.roomId);
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
