import { configureStore } from "@reduxjs/toolkit";

import {
  filterReducer,
  persistentReducer,
} from "../slices";

const store = configureStore({
  reducer: {
    filter: filterReducer,
    persistent: persistentReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
