import { configureStore } from "@reduxjs/toolkit";
import { filterReducer, persistentReducer, } from "../slices";
import { viewReducer } from "../slices/viewSlice"


const store = configureStore({
  reducer: {
    filter: filterReducer,
    persistent: persistentReducer,
    view: viewReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
