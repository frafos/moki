import querySrv from "../../../js/helpers/querySrv";
import { getTypes } from "../../../js/helpers/getTypes.js";
import { getFilters } from "../filter/getFilters.js";

import store from "@/js/store";

/**
*ES request API
* @param {query}  string request path
* @param {{ fce?: (string) => void, reportType?: string } | boolean | null }
params
* @return {json} data from ES
* */
export async function elasticsearchConnection(query,  params = false) {
  var pathname = window.location.pathname;
  pathname = pathname.substr(1);

  if (pathname.substring(pathname.length - 1) === "/") {
    pathname = pathname.substring(0, pathname.length - 1);
  }

  var fce = "";
  if (params?.fce){
    fce = params.fce;
    delete params.fce;
  }

  pathname = pathname.substring(import.meta.env.BASE_URL, pathname.length);
  const { timerange } = store.getState().filter;

  if (query.includes(pathname)  || query.includes("table") ) {
    //get all necessarily parameters (filters, types, timerange)
    var filters = getFilters();
    var types = getTypes();
    console.info("MOKI: send fetch: " + query);
    console.info("MOKI: with filters: " + JSON.stringify(filters));
    console.info("MOKI: with types: " + JSON.stringify(types));
    console.info("MOKI: with timerange: " + timerange[0] + " - " + timerange[1]);
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    var data;
    var response;

    try {
      response = await querySrv(import.meta.env.BASE_URL +"api/" + query, {
        method: "POST",
        timeout: 60000,
        credentials: 'include',
        body: JSON.stringify({
          filters: filters,
          types: types,
          timerange_gte: timerange[0],
          timerange_lte: timerange[1],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          params: params
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": "include",
          "Access-Control-Expose-Headers": "Content-Length"
        }
      });
    } catch (error) {
      return error;
    }

    if (!response.ok) {
      // response
      var error = await response.json();

      if (error.error) {
        return "Problem to connect to elasticsearch. " + error.error;
      } else {
        return "Problem with elasticsearch. " + JSON.stringify(error);
      }
    }

    if(fce !== ""){
      fce(response.headers.get("Content-Length"));
    }

    data = await response.json();
    console.info(new Date() + " MOKI: got elastic data");

    if (data.msg) {
      return data.msg;
    }

    return data;
  }
}