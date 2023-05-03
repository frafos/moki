/*
Class to get data for all charts iin Call dashboard
*/
import TimedateHeatmap from "@charts/timedate_heatmap.jsx";
import TimedateStackedChart from "@charts/timedate_stackedbar.jsx";
import StackedChart from "@charts/stackedbar.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import ValueChart from "@charts/value_chart.jsx";
import {
  parseAggDistinct,
  parseDateHeatmap,
  parseQueryStringData,
  parseStackedbarData,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function OverviewCharts() {
  const { chartsData, charts, isLoading } = useDashboardData(
    "overview/charts",
    {
      functors: [
        //EVENT OVERVIEW TIMELINE
        [{ result: "eventOverviewTimeline", func: parseStackedbarTimeData }],
        //TOTAL EVENTS IN INTERVAL
        [{ result: "totalEventsInInterval", func: parseStackedbarData }],
        //ACTIVITY OF SBC
        [{ result: "activitySBC", func: parseDateHeatmap }],
        //SBC - KEEP ALIVE
        [{ result: "keepAlive", func: parseDateHeatmap }],
        // empty
        [],
        //TAGS LIST
        [],
        //DISTINCT IP
        [{ result: "distinctIP", func: parseAggDistinct }],
        //TOTAL EVENTS IN INTERVAL
        [{ result: "totalEvents", func: parseQueryStringData }],
        //DISTINCT URI
        [{ result: "distinctURI", func: parseAggDistinct }],
      ],
    },
  );

  //render GUI
  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row  no-gutters">
        {charts["DISTINCT IP"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.distinctIP} name={"DISTINCT IP"} />
          </div>
        )}
        {charts["DISTINCT URI"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.distinctURI} name={"DISTINCT URI"} />
          </div>
        )}
        {charts["TOTAL EVENTS"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.totalEvents} name={"# EVENTS"} />
          </div>
        )}
      </div>
      {charts["EVENTS OVER TIME"] && (
        <div className="row no-gutters">
          <TimedateStackedChart
            units={"count"}
            data={chartsData.eventOverviewTimeline}
            id="eventsOverTime"
            name={"EVENTS OVER TIME"}
            keys={"overview"}
            width={width - 300}
          />
        </div>
      )}
      <div className="row no-gutters">
        {charts["TOTAL EVENTS IN INTERVAL"] && (
          <div className="col">
            <StackedChart
              data={chartsData.totalEventsInInterval}
              units={"count"}
              id="totalEvents"
              bottomMargin={80}
              keys={"overview"}
              name={"TOTAL EVENTS IN INTERVAL"}
              width={width - 300}
            />
          </div>
        )}
      </div>
      {charts["NODES - ACTIVITY"] && (
        <div className="row no-gutters">
          <TimedateHeatmap
            data={chartsData.activitySBC}
            marginLeft={"250"}
            name={"NODES - ACTIVITY"}
            units={"any event count"}
            id="activitySBC"
            field={"attrs.hostname"}
            width={width - 300}
          />
        </div>
      )}
      {charts["NODES - KEEP ALIVE"] && (
        <div className="row no-gutters">
          <TimedateHeatmap
            units={"system event count"}
            data={chartsData.keepAlive}
            marginLeft={"250"}
            name={"NODES - KEEP ALIVE"}
            id="keepAlive"
            field={"attrs.sbc"}
            width={width - 300}
          />
        </div>
      )}
    </div>
  );
}

export default OverviewCharts;
