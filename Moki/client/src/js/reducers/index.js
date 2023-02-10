import { SET_FILTERS } from "../constants/action-types";
import { ASSIGN_TYPE } from "../constants/action-types";
import { SET_TIMERANGE } from "../constants/action-types";
import { SET_WIDTH_CHART } from "../constants/action-types";
import { SET_PERNAMENT_FILTERS } from "../constants/action-types";
import { SET_ALL_FILTERS } from "../constants/action-types";

const initialState = {
  types: [],
  filters: [],
  timerange: "",
  pernamentFilters: [],
  width: window.innerWidth
};


function rootReducer(state = initialState, action) {

  if (action.type === ASSIGN_TYPE) {
    return Object.assign({}, state, {
      types: action.payload
    });
  }

  else if (action.type === SET_TIMERANGE) {
    return Object.assign({}, state, {
      timerange: action.payload
    });
  }

  else if (action.type === SET_PERNAMENT_FILTERS) {
    return Object.assign({}, state, {
      pernamentFilters: action.payload
    });
  }

  else if (action.type === SET_FILTERS) {
    return Object.assign({}, state, {
      filters: action.payload
    });
  }

  else if (action.type === SET_WIDTH_CHART) {
    return Object.assign({}, state, {
      width: action.payload
    });
  }

  else if (action.type === SET_ALL_FILTERS) {
    return Object.assign({}, state, action.payload);
  }

  return state;
}
export default rootReducer;