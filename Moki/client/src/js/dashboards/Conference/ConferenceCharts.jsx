/*
Class to get data for all charts in Conference dashboard
*/
import TimedateStackedChart from "@charts/timedate_stackedbar";
import ListChart from "@charts/list_chart";
import ValueChart from "@charts/ValueChart";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseAggAvgCnt,
  parseAggData,
  parseAggQueryWithoutScriptValue,
  parseListData,
  parseListDataSort,
  parseQueryStringData,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function ConferenceCharts() {
  const { chartsData, isLoading } = useDashboardData(
    "conference/charts",
    {
      functors: [
        //SUM CONF-LEAVE
        [{ result: "sumCallEnd", func: parseQueryStringData }],
        //SUM CONF-JOIN
        [{ result: "sumCallStart", func: parseQueryStringData }],
        //DURATION SUM
        [{ result: "durationSum", func: parseAggData }],
        //DURATION SUM
        [{ result: "durationAvg", func: parseAggData }],
        //AVG PARTICIPANTS
        [{ result: "avgParticipants", func: parseAggAvgCnt }],
        //TOP CONFERENCES
        [{ result: "topConferences", func: parseListData }],
        //EVENT CALLS TIMELINE
        [{ result: "eventCallsTimeline", func: parseStackedbarTimeData }],
        //CONFERENCE ACTUAL
        [{ result: "activeConf", func: parseAggQueryWithoutScriptValue }],
        //TOP PARTICIPANTS
        [{ result: "topParticipants", func: parseListData }],
        //TOP ACTIVE CONF
        [{ result: "topActiveConferences", func: parseListDataSort }],
      ],
    },
  );

  //render GUI
  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        <div className="col-auto">
          <ValueChart data={chartsData.activeConf} name={"ACTIVE"} />
        </div>
        <div className="col-auto">
          <ValueChart data={chartsData.sumCallEnd} name={"LEAVEs"} />
        </div>
        <div className="col-auto">
          <ValueChart data={chartsData.sumCallStart} name={"JOINs"} />
        </div>
        <div className="col-auto">
          <ValueChart data={chartsData.durationSum} name={"MAX DURATION"} />
        </div>
        <div className="col-auto">
          <ValueChart data={chartsData.durationAvg} name={"AVG DURATION"} />
        </div>
        <div className="col-auto">
          <ValueChart
            data={chartsData.avgParticipants}
            name={"AVG PARTICIPANT"}
          />
        </div>
      </div>
      <div className="row no-gutters">
        <TimedateStackedChart
          id="eventsOverTime"
          data={chartsData.eventCallsTimeline}
          keys="conference"
          name={"EVENTS OVER TIME"}
          width={width - 300}
        />
      </div>
      <div className="row no-gutters">
        <div className="col-auto">
          <ListChart
            data={chartsData.topConferences}
            name={"TOP CONFERENCES"}
            field={"attrs.conf_id"}
          />
        </div>
        <div className="col-auto">
          <ListChart
            data={chartsData.topActiveConferences}
            name={"TOP ACTIVE CONFERENCES"}
            field={"attrs.conf_id"}
          />
        </div>
        <div className="col-auto">
          <ListChart
            data={chartsData.topParticipants}
            name={"TOP PARTICIPANTS"}
            field={"attrs.from.keyword"}
          />
        </div>
      </div>
    </div>
  );
}

export default ConferenceCharts;
