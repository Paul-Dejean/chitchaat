import { configureStore } from "@reduxjs/toolkit";
import { roomReducer } from "./slices/room";
import { mediaReducer } from "./slices/media";
import {
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
} from "react-redux";

export const store = configureStore({
  reducer: {
    room: roomReducer,
    media: mediaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "room/addConsumer",
          "room/addDataConsumer",
          "media/setAudioStream",
          "media/setVideoStream",
        ],
        ignoredPaths: [
          "room.consumers",
          "room.dataConsumers",
          "media.videoStream",
          "media.audioStream",
        ],
      },
    }),
});

export type Store = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useDispatch = useReduxDispatch.withTypes<AppDispatch>();
export const useSelector = useReduxSelector.withTypes<RootState>();
