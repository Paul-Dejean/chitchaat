import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  audioStream: null as MediaStream | null,
  videoStream: null as MediaStream | null,
};

export const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    setAudioStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.audioStream = action.payload;
    },
    removeAudioStream: (state) => {
      state.audioStream = null;
    },
    setVideoStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.videoStream = action.payload;
    },
    removeVideoStream: (state) => {
      state.videoStream = null;
    },
  },
});

export const mediaActions = mediaSlice.actions;

// Action creators are generated for each case reducer function
export const mediaReducer = mediaSlice.reducer;
