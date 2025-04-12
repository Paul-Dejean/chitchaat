import { RoomClientState } from "@/lib/RoomClient";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DataConsumer } from "mediasoup-client/lib/types";

type Peer = {
  id: string;
  displayName: string;
  isMe: boolean;
};

type Consumer = {
  id: string;
  track: MediaStreamTrack;
  peerId: string;
  isPaused: boolean;
};
const initialState = {
  state: "NEW", // RoomClientState.NEW,
  isCameraEnabled: false,
  isMicrophoneEnabled: false,
  isScreenSharingEnabled: false,
  isChatOpen: false,
  peers: {} as Record<string, Peer>,
  consumers: [] as Consumer[],
  dataConsumers: [] as DataConsumer[],
  messages: [] as {
    isMe: boolean;
    message: string;
    timestamp: number;
    sender: string;
  }[],
};

export const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    toggleVideo: (
      state,
      action: PayloadAction<{ shouldEnableVideo: boolean }>
    ) => {
      console.log(action);
      if (action.payload.shouldEnableVideo === state.isCameraEnabled) {
        return;
      }
      state.isCameraEnabled = action.payload.shouldEnableVideo;
    },
    toggleAudio: (
      state,
      action: PayloadAction<{ isMicrophoneEnabled: boolean }>
    ) => {
      console.log(action);
      if (action.payload.isMicrophoneEnabled === state.isMicrophoneEnabled) {
        return;
      }
      state.isMicrophoneEnabled = action.payload.isMicrophoneEnabled;
    },
    toggleScreenSharing: (
      state,
      action: PayloadAction<{ shouldEnableScreenSharing: boolean }>
    ) => {
      console.log(action);
      if (
        action.payload.shouldEnableScreenSharing ===
        state.isScreenSharingEnabled
      ) {
        return;
      }
      state.isScreenSharingEnabled = action.payload.shouldEnableScreenSharing;
    },

    toggleChat: (state, action: PayloadAction<{ shouldOpenChat: boolean }>) => {
      if (action.payload.shouldOpenChat === state.isChatOpen) {
        return;
      }
      state.isChatOpen = action.payload.shouldOpenChat;
    },

    addPeer: (state, action: PayloadAction<Peer>) => {
      state.peers[action.payload.id] = action.payload;
    },

    removePeer: (state, action: PayloadAction<{ peerId: string }>) => {
      console.log("removing");
      state.peers = Object.fromEntries(
        Object.entries(state.peers).filter(
          ([key]) => key !== action.payload.peerId
        )
      );
      console.log({ peers: state.peers });
    },

    addConsumer: (state, action: PayloadAction<{ consumer: Consumer }>) => {
      console.log("add consumer", action);
      state.consumers.push(action.payload.consumer);
    },
    removeConsumer: (state, action: PayloadAction<{ consumerId: string }>) => {
      console.log({ action });
      console.log(action);
      state.consumers = state.consumers.filter(
        (consumer) => consumer.id !== action.payload.consumerId
      );
    },
    pauseConsumer: (state, action: PayloadAction<{ consumerId: string }>) => {
      console.log("pausing consumer", { action });
      const consumer = state.consumers.find(
        (consumer) => consumer.id === action.payload.consumerId
      );
      if (!consumer) return;
      consumer.isPaused = true;
    },
    resumeConsumer: (state, action: PayloadAction<{ consumerId: string }>) => {
      const consumer = state.consumers.find(
        (consumer) => consumer.id === action.payload.consumerId
      );
      if (!consumer) return;
      consumer.isPaused = false;
    },
    addDataConsumer: (
      state,
      action: PayloadAction<{ dataConsumer: DataConsumer }>
    ) => {
      state.dataConsumers.push(action.payload.dataConsumer);
    },
    updateState: (state, action: PayloadAction<RoomClientState>) => {
      state.state = action.payload;
    },
    leaveRoom: () => {
      return initialState;
    },
    addChatMessage: (
      state,
      action: PayloadAction<{
        isMe: boolean;
        message: string;
        timestamp: number;
        sender: string;
      }>
    ) => {
      state.messages.push(action.payload);
    },
  },
});

export const roomActions = roomSlice.actions;

// Action creators are generated for each case reducer function
export const roomsReducer = roomSlice.reducer;
