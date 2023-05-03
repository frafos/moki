import store from "@/js/store";
import { setFilters } from "@/js/slices";

/**
* Create new filter and store it in redux
* @param {string}  searchValue filter to store
* @return {array} Array of all filters
* */
export async function createFilter(searchValue, filter_id = null, dispatch = true, decrypt = false) {
  var oldFilters = store.getState().filter.filters;
  var colonFirst = searchValue.indexOf(':'); 

  //check if it's avg MoS - bug round up value
  //attrs.rtp-MOScqex-avg: [3 TO 4] to search for 3.x
  if (searchValue.includes("rtp-MOScqex-avg")) {
    let value = parseInt(searchValue.substr(colonFirst + 1));
    searchValue = [searchValue.substr(0, colonFirst + 1), "[", value, " TO ", value + 1, "]"].join('');
  }
  var id = filter_id ? filter_id : oldFilters.length > 0 ? oldFilters[oldFilters.length - 1].id + 1 : 1; //if no dispatch - only one filter value

  if (dispatch) {
    var joined = oldFilters.concat({
      id: id,
      title: searchValue,
      state: 'enable',
      pinned: 'true',
      previousState: "enable"
    });
    store.dispatch(setFilters(joined));
    return joined;
  } else {
    var joined = {
      id: id,
      title: searchValue,
      state: 'enable',
      pinned: 'true',
      previousState: "enable"
    };
    return joined;
  }
};