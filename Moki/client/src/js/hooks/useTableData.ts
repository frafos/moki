/*
Base class for all tables
*/
import { useEffect, useState } from "react";
import { elasticsearchConnection } from "../../gui";
import { parseTableHits } from "../../es-response-parser";
import { getTypes } from "../helpers/getTypes";

import store from "@/js/store";
import { shallowEqual } from "react-redux";
import { useAppSelector } from ".";

function useTableData(
  dashboardName: string,
  withTypes = true,
): { calls: any[]; total: number } {
  const [calls, setCalls] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const timerange = useAppSelector(
    (state) => state.filter.timerange,
    shallowEqual,
  );
  const filters = useAppSelector((state) => state.filter.filters, shallowEqual);
  const types = useAppSelector((state) => state.filter.types, shallowEqual);

  useEffect(() => {
    if (withTypes && getTypes().length == 0) return;
    loadData();
  }, [timerange, filters, types]);

  const loadData = async () => {
    //wait for types to load, it will trigger again
    try {
      const data = await elasticsearchConnection(dashboardName);
      if (typeof data === "string") {
        //error
        console.error(data);
        return;
      } else if (data) {
        await processESData(data);
        console.info(
          new Date() + " MOKI " + dashboardName +
            ": finished parsing table",
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * parse table hits with profile attrs
   * @param  array ES data
   * @return stores data in state
   */
  const processESData = async (esResponse: any) => {
    if (!esResponse) return;

    //only parse table fnc and set total value
    try {
      const profile = store.getState().persistent.profile;
      const data = await parseTableHits(esResponse.hits.hits, profile);
      const totalHits = esResponse.hits.total.value;
      setCalls(data);
      setTotal(totalHits);
    } catch (e) {
      console.log("Error: " + e);
    }
  };

  return { calls, total };
}

export { useTableData };
