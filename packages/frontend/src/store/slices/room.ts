import { RoomClientState } from "@/lib/roomClient";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Consumer } from "mediasoup-client/lib/types";

const initialState = {
  state: RoomClientState.NEW,
  isVideoEnabled: false,
  isAudioEnabled: false,
  isScreenSharingEnabled: false,
  consumers: [] as Consumer[],
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
      if (action.payload.shouldEnableVideo === state.isVideoEnabled) {
        return;
      }
      state.isVideoEnabled = action.payload.shouldEnableVideo;
    },
    toggleAudio: (
      state,
      action: PayloadAction<{ shouldEnableAudio: boolean }>
    ) => {
      console.log(action);
      if (action.payload.shouldEnableAudio === state.isAudioEnabled) {
        return;
      }
      state.isAudioEnabled = action.payload.shouldEnableAudio;
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

    addConsumer: (
      state,
      action: PayloadAction<{ consumer: Consumer & { peerId: string } }>
    ) => {
      console.log(action);
      state.consumers.push(action.payload.consumer);
    },
    removeConsumer: (state, action: PayloadAction<{ consumerId: string }>) => {
      console.log(action);
      state.consumers = state.consumers.filter(
        (consumer) => consumer.id !== action.payload.consumerId
      );
    },
    updateState: (state, action: PayloadAction<RoomClientState>) => {
      state.state = action.payload;
    },
    leaveRoom: (state) => {
      state.state = RoomClientState.NEW;
      state.isAudioEnabled = false;
      state.isVideoEnabled = false;
      state.isScreenSharingEnabled = false;
      state.consumers = [];
    },
  },
});

export const roomActions = roomSlice.actions;

// Action creators are generated for each case reducer function
export const roomsReducer = roomSlice.reducer;
