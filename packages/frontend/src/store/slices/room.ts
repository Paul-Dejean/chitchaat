import { RoomClientState } from "@/lib/roomClient";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Consumer } from "mediasoup-client/lib/types";

export const roomSlice = createSlice({
  name: "room",
  initialState: {
    state: RoomClientState.NEW,
    isVideoEnabled: false,
    isAudioEnabled: false,
    isScreenSharingEnabled: false,
    consumers: [] as Consumer[],
  },
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
    updateState: (state, action: PayloadAction<RoomClientState>) => {
      state.state = action.payload;
    },
  },
});

export const roomActions = roomSlice.actions;

// Action creators are generated for each case reducer function
export const roomsReducer = roomSlice.reducer;
