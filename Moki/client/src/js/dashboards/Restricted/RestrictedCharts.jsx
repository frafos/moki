/*
Class to get data for all charts iin Call dashboard
*/
import ValueChart from "@charts/value_chart.jsx";
import ListChart from "@charts/list_chart.jsx";
import TimedateStackedChart from "@charts/timedate_stackedbar.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseAggData,
  parseAggSumBucketData,
  parseBucketData,
  parseListData,
  parseQueryStringData,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function RestrictedCharts() {
  // dashboardName: "restricted/home",
  // Initialize the state

  const { chartsData, isLoading } = useDashboardData("restricted/home", {
    functors: [
      //SUM CALL-END
      [{ result: "sumCallEnd", func: parseQueryStringData }],
      //SUM CALL-ATTEMPT
      [{ result: "sumCallAttempt", func: parseQueryStringData }],
      //CALLING COUNTRIES
      [{ result: "callingCountries", func: parseListData }],
      //DURATION SUM
      [{ result: "durationSum", func: parseAggData }],
      //ANSWER-SEIZURE RATIO
      [{ result: "answerSeizureRatio", func: parseAggSumBucketData }],
      //AVG DURATION
      [{ result: "avgDuration", func: parseAggData }],
      //SUM DURATION OVER TIME
      [{ result: "sumDurationOverTime", func: parseBucketData }],
      //FROM UA
      [{ result: "fromUA", func: parseListData }],
      //SOURCE IP ADDRESS
      [{ result: "sourceIP", func: parseListData }],
      //EVENT CALLS TIMELINE
      [{ result: "eventCallsTimeline", func: parseStackedbarTimeData }],
      //EVENT EXCEEDED TIMELINE
      [{ result: "eventExceededTimeline", func: parseStackedbarTimeData }],
      //TOP 10 TO
      [{ result: "top10to", func: parseListData }],
      //AVG MoS
      [{ result: "avgMoS", func: parseAggData }],
    ],
  });

  const width = useSelector((state) => state.persistent.width);

  return (
    <div>
      {isLoading && <LoadingScreenCharts left="0" />}{" "}
      <div className="row no-gutters">
        <div className="col-auto">
          <ValueChart
            data={chartsData.sumCallEnd}
            name={"# CALLS"}
            fontSize={"1.5rem"}
          />
        </div>{" "}
        <div className="col-auto">
          <ValueChart
            data={chartsData.sumCallAttempt}
            name={"# ATTEMPTS"}
            fontSize={"1.5rem"}
          />
        </div>{" "}
        <div className="col-auto">
          <ValueChart
            data={chartsData.durationSum}
            name={"SUM DURATION"}
            fontSize={"1.5rem"}
          />
        </div>{" "}
        <div className="col-auto">
          <ValueChart
            data={chartsData.answerSeizureRatio}
            name={"ASR (%)"}
            fontSize={"1.5rem"}
          />
        </div>{" "}
        <div className="col-auto">
          <ValueChart
            data={chartsData.avgDuration}
            name={"AVG LEN (min)"}
            fontSize={"1.5rem"}
          />
        </div>{" "}
        <div className="col-auto">
          <ValueChart data={chartsData.avgMoS} name={"AVG MoS"} />
        </div>
      </div>{" "}
      <div className="row no-gutters">
        <TimedateStackedChart
          id="eventsOverTimeCalls"
          data={chartsData.eventCallsTimeline}
          name={"EVENTS OVER TIME"}
          keys={"user"}
          width={width - 300}
        />
      </div>{" "}
      <div className="row no-gutters">
        <TimedateStackedChart
          id="eventExceededTimeline"
          data={chartsData.eventExceededTimeline}
          name={"INCIDENTS OVER TIME"}
          keys={"exceeded"}
          width={width - 300}
        />
      </div>

      <div className="row no-gutters">
        <div className="col-auto">
          <ListChart
            data={chartsData.sourceIP}
            name={"SOURCE IP ADDRESS"}
            field={"attrs.source"}
          />
        </div>{" "}
        <div className="col-auto">
          <ListChart
            data={chartsData.callingCountries}
            name={"COUNTRIES"}
            field={"geoip.country_code2"}
          />
        </div>{" "}
        <div className="col-auto">
          <ListChart
            data={chartsData.top10to}
            name={"TOP 10 TO"}
            field={"attrs.to.keyword"}
          />
        </div>{" "}
        <div className="col-auto">
          <ListChart
            data={chartsData.fromUA}
            name={"FROM UA"}
            field={"attrs.from-ua"}
          />
        </div>
      </div>
    </div>
  );
}

export default RestrictedCharts;
