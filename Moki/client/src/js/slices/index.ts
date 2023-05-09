import { createSlice } from "@reduxjs/toolkit";

interface FilterState {
  types: any,
  filters: any,
  permanentFilters: any,
  timerange: [number, number, string],
}

const filterSlice = createSlice({
  name: "filters",
  initialState: {
    types: [],
    filters: [],
    permanentFilters: [],
    timerange: [] as unknown,
  } as FilterState,
  reducers: {
    assignTypes(state, action) {
      state.types = action.payload;
    },
    setFilters(state, action) {
      state.filters = action.payload;
    },
    setTimerange(state, action) {
      state.timerange = action.payload;
    },
    setPermanentFilters(state, action) {
      state.permanentFilters = action.payload;
    },
    setAllFilters(state, action) {
      state = { ...state, ...action.payload };
    },
  },
});

export const { reducer: filterReducer } = filterSlice;
export const {
  assignTypes,
  setFilters,
  setAllFilters,
  setPermanentFilters,
  setTimerange,
} = filterSlice.actions;

interface PersistentState {
  user: any,
  profile: [],
  settings: [],
  layout: {
    charts: Record<string, string[]>
  },
  width: number,
}

const persistentSlice = createSlice({
  name: "persistent",
  initialState: {
    user: { aws: false },
    profile: [],
    settings: [],
    layout: {},
    width: window.innerWidth,
  } as PersistentState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setChartsWidth(state, action) {
      state.width = action.payload;
    },
    setProfile(state, action) {
      state.profile = action.payload;
    },
    setSettings(state, action) {
      state.settings = action.payload;
    },
    setLayout(state, action) {
      state.layout = action.payload;
    },
  },
});

export const { reducer: persistentReducer } = persistentSlice;
export const { setUser, setProfile, setSettings, setLayout, setChartsWidth } =
  persistentSlice.actions;
