import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ViewState {
  navbarExpanded: boolean;
}

const viewSlice = createSlice({
  name: "view",
  initialState: {
    navbarExpanded: true,
  } as ViewState,
  reducers: {
    setNavbarExpanded(state, action: PayloadAction<boolean>) {
      state.navbarExpanded = action.payload;
    }
  },
});

export const { reducer: viewReducer } = viewSlice;
export const { setNavbarExpanded} = viewSlice.actions;
