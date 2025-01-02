import { RoomClientState } from "@/lib/roomClient";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const roomSlice = createSlice({
  name: "room",
  initialState: {
    state: RoomClientState.NEW,
  },
  reducers: {
    updateState: (state, action: PayloadAction<RoomClientState>) => {
      state.state = action.payload;
    },
  },
});

export const roomActions = roomSlice.actions;

// Action creators are generated for each case reducer function
export const roomsReducer = roomSlice.reducer;
