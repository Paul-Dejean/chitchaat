import { configureStore } from "@reduxjs/toolkit";
import { roomsReducer } from "./slices/room";
import {
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
} from "react-redux";

export const store = configureStore({
  reducer: {
    room: roomsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["room/addConsumer", "room/addDataConsumer"],
        ignoredPaths: ["room.consumers", "room.dataConsumers"], // Ensures all `track` objects in any consumer are ignored
      },
    }),
});

export type Store = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useDispatch = useReduxDispatch.withTypes<AppDispatch>();
export const useSelector = useReduxSelector.withTypes<RootState>();
