/*
Class to get data for all charts iin Call dashboard
*/
import SunburstChart from "@charts/sunburst_chart";
import DonutChart from "@charts/donut_chart";
import DatebarChart from "@charts/datebar_chart";
import TableChart from "@charts/list_chart";
import ValueChart from "@charts/ValueChart";
import StackedChartLine from "@charts/timedate_stackedbar_with_line_chart";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseAggData,
  parseAggSumBucketData,
  parseBucketData,
  parseListData,
  parseQueryStringData,
  parseStackedbarTimeData,
  parseSunburstData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function CallCharts() {
  // Initialize the state
  const { chartsData, charts, isLoading } = useDashboardData("calls/charts", {
    functors: [
      //CALL TERMINATED 0
      [{
        result: "callTerminated",
        func: parseBucketData,
        attrs: ["attrs.originator"],
      }],
      //CALL SUCCESS RATIO 1
      [{
        result: "callSuccessRatio",
        func: parseSunburstData,
        attrs: ["attrs.sip-code"],
      }],
      //SUM CALL-ATTEMPT 2
      [{
        result: "sumCallAttempt",
        func: parseQueryStringData,
        attrs: ["attrs.type"],
      }],
      //SUM CALL-END 3
      [{
        result: "sumCallEnd",
        func: parseQueryStringData,
        attrs: ["attrs.type"],
      }],
      //SUM CALL-START 4
      [{
        result: "sumCallStart",
        func: parseQueryStringData,
        attrs: ["attrs.type"],
      }],
      //DURATION SUM 5
      [{
        result: "durationSum",
        func: parseAggData,
        attrs: ["attrs.duration"],
      }],
      //NOT USED 6
      [],
      //AVG MoS 7
      [{
        result: "avgMoS",
        func: parseAggData,
        attrs: ["attrs.rtp-MOScqex-avg"],
      }],
      //ANSWER-SEIZURE RATIO 8
      [{ result: "answerSeizureRatio", func: parseAggSumBucketData }],
      //CALLING COUNTRIES 9
      [{
        result: "callingCountries",
        func: parseListData,
        attrs: ["geoip.src.iso_code"],
      }],
      //SUM DURATION OVER TIME 10
      [{
        result: "sumDurationOverTime",
        func: parseBucketData,
        attrs: ["attrs.duration"],
      }],
      //MAX DURATION 11
      [{
        result: "maxDuration",
        func: parseAggData,
        attrs: ["attrs.duration"],
      }],
      //NOT USED 12
      [],
      //AVG DURATION 13
      [{
        result: "avgDuration",
        func: parseAggData,
        attrs: ["attrs.duration"],
      }],
      //DURATION GROUP 14
      [{
        result: "durationGroup",
        func: parseListData,
        attrs: ["attrs.durationGroup"],
      }],
      //SIP-CODE COUNT 15
      [{
        result: "sipcodeCount",
        func: parseListData,
        attrs: ["attrs.sip-code"],
      }],
      //CALLED COUNTRIES 16
      [{
        result: "calledCountries",
        func: parseListData,
        attrs: ["attrs.tst_cc"],
      }],
      //EVENT CALLS TIMELINE 17
      [{
        result: "eventCallsTimeline",
        func: parseStackedbarTimeData,
        attrs: ["attrs.type"],
      }],
      //ASR OVER TIME 18
      [{
        result: "asrDurationOverTime",
        func: parseBucketData,
        attrs: ["attrs.duration"],
      }],
    ],
  });

  //render GUI
  const width = useSelector((state) => state.persistent.width);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        {charts["ATTEMPTs"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.sumCallAttempt} name={"ATTEMPTs"} />
          </div>
        )}
        {charts["ENDs"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.sumCallEnd} name={"ENDs"} />
          </div>
        )}
        {charts["STARTs"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.sumCallStart} name={"STARTs"} />
          </div>
        )}
        {charts["ASR (%)"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.answerSeizureRatio} name={"ASR (%)"} />
          </div>
        )}
        {charts["MAX DURATION"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.maxDuration} name={"MAX DURATION"} />
          </div>
        )}
        {charts["AVG DURATION"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.avgDuration} name={"AVG DURATION"} />
          </div>
        )}
        {charts["SUM DURATION"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.durationSum} name={"SUM DURATION"} />
          </div>
        )}
        {charts["AVG MoS"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.avgMoS} name={"AVG MoS"} />
          </div>
        )}
      </div>
      {charts["EVENTS OVER TIME"] && (
        <div className="row no-gutters">
          <StackedChartLine
            id="eventsOverTime"
            data={chartsData.eventCallsTimeline}
            name={"EVENTS OVER TIME"}
            keys={"calls"}
            width={width - 300}
            height={200}
            data2={chartsData.asrDurationOverTime}
            units={"count"}
          />
        </div>
      )}
      {charts["SUM DURATION OVER TIME"] && (
        <div className="row no-gutters">
          <DatebarChart
            data={chartsData.sumDurationOverTime}
            id={"sumDurationOverTime"}
            marginLeft={25}
            height={200}
            name={"SUM DURATION OVER TIME"}
            width={width - 300}
          />
        </div>
      )}
      <div className="row no-gutters">
        {charts["CALL SUCCESS RATIO"] && (
          <div className="col-auto" style={{ "marginRight": "5px" }}>
            <SunburstChart
              data={chartsData.callSuccessRatio}
              name={"CALL SUCCESS RATIO"}
              width={(width - 300) / 2}
              ends={chartsData.sumCallEnd}
              units={"count"}
            />
          </div>
        )}
        {charts["SIP-CODE COUNT"] && (
          <div className="col-auto">
            <TableChart
              data={chartsData.sipcodeCount}
              name={"SIP-CODE COUNT"}
              field={"attrs.sip-code"}
            />
          </div>
        )}
        {charts["CALL TERMINATED"] && (
          <div className="col-auto" style={{ "marginRight": "5px" }}>
            <DonutChart
              data={chartsData.callTerminated}
              name={"CALL TERMINATED"}
              id="callTerminated"
              width={(width - 300) / 2}
              height={170}
              field={"attrs.originator"}
              legendSize={120}
              units={"count"}
            />
          </div>
        )}
        {charts["CALLING COUNTRIES"] && (
          <div className="col-auto">
            <TableChart
              data={chartsData.callingCountries}
              name={"CALLING COUNTRIES"}
              field={"geoip.country_code2"}
            />
          </div>
        )}
        {charts["CALLED COUNTRIES"] && (
          <div className="col-auto">
            <TableChart
              data={chartsData.calledCountries}
              name={"CALLED COUNTRIES"}
              field={"attrs.dst_cc"}
            />
          </div>
        )}
        {charts["DURATION GROUP"] && (
          <div className="col-auto">
            <TableChart
              data={chartsData.durationGroup}
              name={"DURATION GROUP"}
              field={"attrs.durationGroup"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CallCharts;
