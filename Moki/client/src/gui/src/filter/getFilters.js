import store from "../../../js/store/index";

/**
*Get filters from redux store and return only enable ones
* @return {array} array of filter object
* */
export const getFilters = () => {
  var filt = store.getState().filters;
  var filters = JSON.parse(JSON.stringify(filt));
  var filtersResult = [];

  for (const filter of filters) {
    //exceeded exception, disable filter with exceeded-by or exceeded for any other dashboard than Exceeded
    //enable automatically exceeded filters in exceeded dashboard
    if (window.location.pathname === "/exceeded") {
      if (filter.title.includes("exceeded") && filter.state === "enable" && filter.previousState === "enable") {
        filter.state = "enable";
      }
    }
    else {
      if (filter.title.includes("exceeded")) {
        filter.state = "disable";
      }
    }
  }

  //remove filters with disable state
  for (const filter of filters) {
    if (filter.state !== 'disable') {
      filtersResult.push(filter);
    }
  }

  return filtersResult;
};