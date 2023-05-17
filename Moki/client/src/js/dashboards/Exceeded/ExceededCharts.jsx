/*
Class to get data for all charts iin Call dashboard
*/
import TimedateStackedChart from "@charts/timedate_stackedbar";
import DonutChart from "@charts/donut_chart";
import ListChart from "@charts/list_chart";
import ValueChart from "@charts/ValueChart";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseBucketData,
  parseListData,
  parseQueryStringData,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function ExceededCharts() {
  const { chartsData, charts, isLoading } = useDashboardData(
    "exceeded/charts",
    {
      functors: [
        //EVENT CALLS TIMELINE
        [{
          result: "eventCallsTimeline",
          func: parseStackedbarTimeData,
          attrs: ["exceeded"],
        }],
        //EXCEEDED COUNT
        [{ result: "exceededCount", func: parseQueryStringData }],
        //EXCEEDED TYPE
        [{
          result: "exceededType",
          func: parseBucketData,
          attrs: ["exceeded"],
        }],
        //TOP OFFENDERS
        [{
          result: "topOffenders",
          func: parseListData,
          attrs: ["attrs.from"],
        }],
        //EVENTS BY IP ADDR
        [{ result: "ipAddress", func: parseListData, attrs: ["attrs.source"] }],
        //TOP SUBNETS /24 EXCEEDED
        [{
          result: "subnets",
          func: parseListData,
          attrs: ["attrs.sourceSubnets"],
       }],
        //EXCEEDED TYPES
        [{ result: "exceededBy", func: parseListData, attrs: ["exceeded-by"] }],
      ],
    },
  );

  const width = useSelector((state) => state.persistent.width);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}{" "}
      <div className="row no-gutters">
        {charts["EVENTS OVER TIME"] && (
          <div className="col-auto" style={{ "marginRight": "5px" }}>
            <TimedateStackedChart
              id="eventsOverTime"
              data={chartsData.eventCallsTimeline}
              units={"count"}
              name={"EVENTS OVER TIME"}
              keys={"exceeded"}
              width={width - 400}
            />
          </div>
        )}
        {charts["INCIDENTS COUNT"] && (
          <div className="col-auto">
            <ValueChart
              data={chartsData.exceededCount}
              name={"INCIDENTS COUNT"}
              biggerFont={"biggerFont"}
            />
          </div>
        )}
        {charts["EXCEEDED TYPE"] && (
          <div className="col-auto" style={{ "marginRight": "5px" }}>
            <DonutChart
              data={chartsData.exceededType}
              units={"count"}
              name={"EXCEEDED TYPE"}
              id="exceededType"
              height={170}
              field="exceeded"
            />
          </div>
        )}
        {charts["EXCEEDED BY"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.exceededBy}
              name={"EXCEEDED BY"}
              field={"exceeded-by"}
            />
          </div>
        )}
        {charts["TOP OFFENDERS"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.topOffenders}
              name={"TOP OFFENDERS"}
              field={"attrs.from.keyword"}
            />
          </div>
        )}
        {charts["TOP SUBNETS /24 EXCEEDED"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.subnets}
              name={"TOP SUBNETS /24 EXCEEDED"}
              field={"attrs.sourceSubnets"}
            />
          </div>
        )}
        {charts["EXCEEDED EVENTS BY IP ADDR"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.ipAddress}
              name={"EXCEEDED EVENTS BY IP ADDR"}
              field={"attrs.source"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ExceededCharts;
