/*
Base class for all dashboards
*/
import { useEffect, useRef, useState } from "react";
import { elasticsearchConnection } from "../../gui";

import store from "@/js/store";
import { loadTypes } from "../bars/Typebar";
import { shallowEqual } from "react-redux";
import { assignTypes } from "../slices";
import { getTypes } from "../helpers/getTypes";
import { useAppSelector } from ".";

//TODO: notification in store, not in window object
declare global {
    interface Window { notification: any; }
}

//special parsing data - last bucket from different parsing function
//i = 0 - time interval ago;   i = 1 actual
function getLastValueInInterval(data: any[], i: number) {
  if (data && data.length > 0 && data[1].values.length > 0) {
    //get last time interval
    let lastValue;
    if (i === 0) {
      lastValue = data[1].values[data[1].values.length - 2];
    } else {
      lastValue = data[1].values[data[1].values.length - 1];
    }
    return (lastValue?.value ?? 0);
  }
  return 0;
}

/**
 * @param withTypes if types need to be loaded
 */
function useDashboardData(
  dashboardName: any,
  callbacks: { functors: any[] },
  withTypes = true,
  reportType: string | null = null
): { chartsData: any; isLoading: boolean; charts: string[] } {
  // Initialize the state
  const [isLoading, setIsLoading] = useState(true);
  const [charts, setCharts] = useState<string[]>([]);
  const transientState = useRef<any>({});

  const { profile } = store.getState().persistent;
  const layout = useAppSelector((state) => state.persistent.layout);
  const timerange = useAppSelector((state) => state.filter.timerange);
  const filters = useAppSelector((state) => state.filter.filters, shallowEqual);
  const types = useAppSelector((state) => state.filter.types, shallowEqual);
  const name = dashboardName.substr(0, dashboardName.indexOf("/"));

  useEffect(() => {
    if (!withTypes || reportType != null) return;
    loadTypes();
    return (() => {
      store.dispatch(assignTypes([]));
    });
  }, []);

  useEffect(() => {
    if (layout.charts[name]) {
      setCharts(layout.charts[name]);
    }
  }, [layout]);

  useEffect(() => {
    if (withTypes && getTypes().length == 0) return;
    loadData();
  }, [timerange, filters, types]);

  const processESData = async (data: any) => {
    if (!data || !data.responses) return;

    let functors: any = [];
    for (
      let i = 0;
      (i < data.responses.length) && (i < callbacks.functors.length);
      i++
    ) {
      // functors for i'th response
      functors = callbacks.functors[i];
      // apply all the functors to the i'th response
      for (let j = 0; j < functors.length; j++) {
        let attrs = [];
        if (functors[j].attrs) attrs = functors[j].attrs;
        // special loader
        // multi parser "Regs", "data.responses[5]", "Regs-1d", "data.responses[6]"
        if (functors[j].type === "multipleLineData") {
          transientState.current[functors[j].result] = await functors[j].func(
            functors[j].details[0],
            data.responses[i],
            functors[j].details[1],
            data.responses[i + 1],
            profile,
            attrs,
          );
        } // parseEventsRateData - pass also hours and total count
        else if (functors[j].type === "parseEventsRateData") {
          const hours = (timerange[1] - timerange[0]) / 3600000;
          transientState.current[functors[j].result] = await functors[j].func(
            data.responses[i],
            data.responses[2],
            hours,
          );
        } //multileLine domains need second result
        else if (functors[j].type === "multipleLineDataDomains") {
          const hours = (timerange[1] - timerange[0]) / 3600000;
          transientState.current[functors[j].result] = await functors[j].func(
            data.responses[i],
            data.responses[i + 1],
            data.responses[2],
            hours,
          );
        } else {
          transientState.current[functors[j].result] = await functors[j].func(
            data.responses[i],
            profile,
            attrs,
          );
        }
      }
    }
  };

  const loadData = async () => {
    // wait for types to load, it will trigger again
    // calls dashboard has special loader
    // TODO: replace by react router here, notification should be in a store
    try {
      setIsLoading(true);
      const params = reportType != null ? { reportType } : null;
      const data = await elasticsearchConnection(dashboardName, params);

      if (typeof data === "string") {
        window.notification.showError({
          errno: 2,
          text: data,
          level: "error",
        });
        setIsLoading(false);
        return;
      } else if (data) {
        await processESData(data);
        setIsLoading(false);
        console.info(new Date() + " MOKI DASHBOARD: finished parsing data");
      }
    } catch (e) {
      window.notification.showError({
        errno: 2,
        text: "Problem to parse data.",
        level: "error",
      });
      console.error(e);
      setIsLoading(false);
    }
  };

  return {
    chartsData: transientState.current,
    isLoading,
    charts,
  };
}

export { getLastValueInInterval, useDashboardData };
