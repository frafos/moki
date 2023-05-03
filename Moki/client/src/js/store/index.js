import { configureStore } from "@reduxjs/toolkit";

import {
  filterReducer,
  persistentReducer,
} from "../slices";

export default configureStore({
  reducer: {
    filter: filterReducer,
    persistent: persistentReducer,
  }
})
