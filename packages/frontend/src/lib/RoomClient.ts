// import { Device } from "mediasoup-client";

import { Store } from "@/store";
import { roomActions } from "@/store/slices/room";
import {
  Consumer,
  DataConsumer,
  DataProducer,
  Producer,
  SctpStreamParameters,
} from "mediasoup-client/lib/types";
import { MediasoupClient } from "./MediasoupClient";
import { WsClient } from "./WsClient";
import { LocalMedia } from "./LocalMedia";

export enum RoomClientState {
  NEW = "NEW",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  CLOSED = "CLOSED",
}

export class RoomClient {
  private wsClient: WsClient;
  private store: Store;

  private microphoneProducer: Producer | null = null;
  private videoProducer: Producer | null = null;
  private desktopProducer: Producer | null = null;
  private consumers: Consumer[] = [];
  private mediasoupClient: MediasoupClient;
  private chatDataProducer: DataProducer | null = null;
  private dataConsumers: DataConsumer[] = [];
  private displayName: string | null = null;

  public state: RoomClientState = RoomClientState.NEW;
  public localMedia = new LocalMedia();

  constructor({ store }: { store: Store }) {
    this.store = store;
    console.log(import.meta.env);
    if (!import.meta.env.VITE_API_URL) {
      throw new Error("API URL not set");
    }
    this.wsClient = new WsClient(import.meta.env.VITE_API_URL);
    this.mediasoupClient = new MediasoupClient(this.wsClient);
  }

  private initEventListeners() {
    this.wsClient.registerHandler("disconnect", () => {
      console.info("Disconnected from server");
      this.leaveRoom();
    });

    this.wsClient.registerHandler("connect_error", (error) => {
      console.error("Connection error:", error);
      this.leaveRoom();
    });

    this.wsClient.registerHandler("consumerClosed", ({ consumerId }) => {
      const consumer = this.consumers.find(
        (consumer) => consumer.id === consumerId
      );
      consumer?.close();
      this.store.dispatch(roomActions.removeConsumer({ consumerId }));
    });

    this.wsClient.registerHandler("consumerPaused", ({ consumerId }) => {
      const consumer = this.consumers.find(
        (consumer) => consumer.id === consumerId
      );
      console.log("pausing", { consumer });
      consumer?.pause();
      this.store.dispatch(roomActions.pauseConsumer({ consumerId }));
    });

    this.wsClient.registerHandler("consumerResumed", ({ consumerId }) => {
      console.log("");
      const consumer = this.consumers.find(
        (consumer) => consumer.id === consumerId
      );
      consumer?.resume();
      this.store.dispatch(roomActions.resumeConsumer({ consumerId }));
    });

    this.wsClient.registerHandler("producerResumed", ({ producerId }) => {
      if (producerId === this.microphoneProducer?.id) {
        this.store.dispatch(
          roomActions.toggleAudio({ isMicrophoneEnabled: true })
        );
      }
    });

    this.wsClient.registerHandler(
      "peerClosed",
      async ({ peerId }: { peerId: string }) => {
        this.store.dispatch(roomActions.removePeer({ peerId }));
      }
    );

    this.wsClient.registerHandler(
      "newPeer",
      async (newPeer: { id: string; displayName: string }) => {
        console.log({ newPeer });
        this.store.dispatch(
          roomActions.addPeer({
            ...newPeer,

            isMe: newPeer.id === this.wsClient.id,
          })
        );
      }
    );

    this.wsClient.registerHandler(
      "newProducer",
      async ({
        producerId,
        peerId,
      }: {
        producerId: string;
        peerId: string;
      }) => {
        if (
          this.consumers.find((consumer) => consumer.producerId === producerId)
        ) {
          return;
        }

        const consumer = await this.mediasoupClient.createConsumer(producerId);

        this.consumers.push(consumer);
        console.log("this.consumers", this.consumers);
        this.store.dispatch(
          roomActions.addConsumer({
            consumer: {
              id: consumer.id,
              track: consumer.track,
              peerId,
              isPaused: consumer.paused,
            },
          })
        );

        await this.mediasoupClient.resumeConsumer(consumer.id);
        this.store.dispatch(
          roomActions.resumeConsumer({ consumerId: consumer.id })
        );
      }
    );

    this.wsClient.registerHandler(
      "newDataProducer",
      async ({
        dataProducerId,
        peerId,
        sctpStreamParameters,
      }: {
        dataProducerId: string;
        peerId: string;
        sctpStreamParameters: SctpStreamParameters;
      }) => {
        console.log("newDataProducer", {
          dataProducerId,
          sctpStreamParameters,
          peerId,
        });
        const dataConsumer = await this.mediasoupClient.createDataConsumer({
          dataProducerId,
        });

        dataConsumer.on("message", (data) => {
          console.log("received message", { data });
          const { message, timestamp, sender } = JSON.parse(data);
          this.store.dispatch(
            roomActions.addChatMessage({
              message,
              isMe: false,
              timestamp,
              sender,
            })
          );
        });

        this.dataConsumers.push(dataConsumer);
        this.store.dispatch(
          roomActions.addDataConsumer({
            dataConsumer,
          })
        );
      }
    );
  }

  async joinRoom(roomId: string, userName: string) {
    this.state = RoomClientState.CONNECTING;
    this.store.dispatch(roomActions.updateState(RoomClientState.CONNECTING));

    await this.wsClient.connect();
    this.initEventListeners();

    const { room } = (await this.wsClient.emitMessage("joinRoom", {
      roomId,
      displayName: userName,
    })) as {
      room: {
        peers: {
          id: string;
          displayName: string;
          producers: Producer[];
          dataProducers: DataProducer[];
        }[];
      };
      displayName: string;
    };

    this.displayName = userName;

    await this.mediasoupClient.initDevice(roomId);
    await this.mediasoupClient.initTransports();
    await this.enableChatDataProducer();
    this.state = RoomClientState.CONNECTED;
    this.store.dispatch(roomActions.updateState(RoomClientState.CONNECTED));

    for (const peer of room.peers) {
      this.store.dispatch(
        roomActions.addPeer({
          id: peer.id,
          displayName: peer.displayName,
          isMe: peer.id === this.wsClient.id,
        })
      );
      if (peer.id !== this.wsClient.id) {
        for (const producer of peer.producers) {
          const consumer = await this.mediasoupClient.createConsumer(
            producer.id
          );

          this.consumers.push(consumer);
          console.log("this.consumers", this.consumers);

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

          await this.mediasoupClient.resumeConsumer(consumer.id);
          this.store.dispatch(
            roomActions.resumeConsumer({ consumerId: consumer.id })
          );
        }
        for (const dataProducer of peer.dataProducers) {
          const dataConsumer = await this.mediasoupClient.createDataConsumer({
            dataProducerId: dataProducer.id,
          });
          dataConsumer.on("message", (data) => {
            console.log("received message", { data });
            const { message, timestamp, sender } = JSON.parse(data);
            this.store.dispatch(
              roomActions.addChatMessage({
                message,
                isMe: false,
                timestamp,
                sender,
              })
            );
          });
          this.dataConsumers.push(dataConsumer);
          this.store.dispatch(
            roomActions.addDataConsumer({
              dataConsumer,
            })
          );
        }
      }
    }
  }

  leaveRoom() {
    this.mediasoupClient.closeTransports();
    this.wsClient.disconnect();
    this.store.dispatch(roomActions.leaveRoom());
  }

  async enableWebcam({ produce = true }: { produce?: boolean } = {}) {
    if (this.desktopProducer) {
      await this.disableScreenSharing();
    }
    if (this.videoProducer) {
      return this.localMedia.getVideoStream();
    }
    const stream = await this.localMedia.getVideoStream();
    const track = stream.getVideoTracks()[0];
    if (produce) {
      this.videoProducer = await this.mediasoupClient.createProducer(track);
    }
    this.store.dispatch(roomActions.toggleVideo({ shouldEnableVideo: true }));
    return stream;
  }

  async disableWebcam() {
    if (this.videoProducer) {
      this.localMedia.stopVideoStream();
      this.videoProducer.close();
      this.mediasoupClient.closeProducer(this.videoProducer.id);
      this.videoProducer = null;
    }
    this.store.dispatch(roomActions.toggleVideo({ shouldEnableVideo: false }));
  }

  async enableScreenSharing() {
    if (this.videoProducer) {
      await this.disableWebcam();
    }
    if (this.desktopProducer) {
      return this.localMedia.getScreenStream();
    }
    const stream = await this.localMedia.getScreenStream();
    const track = stream.getVideoTracks()[0];
    this.desktopProducer = await this.mediasoupClient.createProducer(track);
    this.desktopProducer?.on("trackended", () => this.disableScreenSharing());
    this.store.dispatch(
      roomActions.toggleScreenSharing({ shouldEnableScreenSharing: true })
    );
    return stream;
  }

  async disableScreenSharing() {
    if (this.desktopProducer) {
      this.localMedia.stopScreenStream();
      this.desktopProducer.close();
      this.mediasoupClient.closeProducer(this.desktopProducer.id);
      this.desktopProducer = null;
    }
    this.store.dispatch(
      roomActions.toggleScreenSharing({ shouldEnableScreenSharing: false })
    );
  }

  async enableMicrophone({ produce = true }: { produce?: boolean } = {}) {
    if (this.microphoneProducer) {
      await this.mediasoupClient.resumeProducer(this.microphoneProducer.id);
      return this.localMedia.getAudioStream();
    }
    const stream = await this.localMedia.getAudioStream();
    const track = stream.getAudioTracks()[0];
    if (produce) {
      this.microphoneProducer =
        await this.mediasoupClient.createProducer(track);
    }
    this.store.dispatch(roomActions.toggleAudio({ isMicrophoneEnabled: true }));
    return stream;
  }

  async disableMicrophone() {
    if (this.microphoneProducer) {
      await this.mediasoupClient.pauseProducer(this.microphoneProducer.id);
      this.store.dispatch(
        roomActions.toggleAudio({ isMicrophoneEnabled: false })
      );
    }
    this.store.dispatch(
      roomActions.toggleAudio({ isMicrophoneEnabled: false })
    );
  }

  async enableChatDataProducer() {
    if (this.chatDataProducer) {
      return;
    }
    this.chatDataProducer = await this.mediasoupClient.createDataProducer();
    console.log({ chatDataProducer: this.chatDataProducer });
  }

  async sendChatMessage(message: string) {
    if (!this.chatDataProducer) {
      throw new Error("Chat data producer not enabled");
    }
    console.log("sending message", message);

    this.chatDataProducer.send(
      JSON.stringify({
        message,
        timestamp: Date.now(),
        sender: this.displayName!,
      })
    );
    this.store.dispatch(
      roomActions.addChatMessage({
        message,
        isMe: true,
        timestamp: Date.now(),
        sender: this.displayName!,
      })
    );
  }

  public getCurrentVideoStream() {
    if (this.localMedia.isVideoStreamActive()) {
      return this.localMedia.getVideoStream();
    }
    return null;
  }

  public getCurrentAudioStream() {
    if (this.localMedia.isAudioStreamActive()) {
      return this.localMedia.getAudioStream();
    }
  }
}
