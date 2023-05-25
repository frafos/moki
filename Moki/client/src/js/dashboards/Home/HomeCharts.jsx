/*
Class to get data for all charts iin Call dashboard
*/
import { useDashboardData, getLastValueInInterval } from "@hooks/useDashboardData";
import TimedateHeatmap from "@charts/TimedateHeatmap";
import CountUpChart from "@charts/CountUpChart";
import ValueChart from "@charts/ValueChart";
import MultipleAreaChart from "@charts/MultipleAreaChart";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import MultivalueChart from "@charts/multivalue_chart";
import ListChart from "@charts/list_chart";
import {
  parseAggData,
  parseAggDistinct,
  parseAggSumBucketData,
  parseDateHeatmap,
  parseListData,
  parseMultipleData,
  parseMultipleLineDataShareAxis,
  parseMultipleLineDataShareAxisWithoutAgg,
  parseQueryStringData,
  parseRatio,
} from "../../../es-response-parser";

function HomeCharts() {
  const { chartsData, charts, isLoading } = useDashboardData("home/charts", {
    functors: [
      //SUM CALL-END 0
      [{ result: "sumCallEnd", func: parseQueryStringData }],
      //SUM CALL-ATTEMPT 1
      [{ result: "sumCallAttempt", func: parseQueryStringData }],
      [],
      ////DURATION SUM  3
      [{ result: "durationSum", func: parseAggData }],
      //ANSWER-SEIZURE RATIO 4
      [{ result: "answerSeizureRatio", func: parseAggSumBucketData }],
      //AVG DURATION 5
      [{ result: "avgDuration", func: parseAggData }],
      //DATE HEATMAP 6
      [{
        result: "typeDateHeatmap",
        func: parseDateHeatmap,
        attrs: ["attrs.type", "attrs.type"],
      }],
      //PARALLEL CALLS 7+8
      [{
        result: "parallelCalls",
        func: parseMultipleLineDataShareAxis,
        type: "multipleLineData",
        details: ["Calls", "Calls-1d"],
      }],
      [], //don't delete
      //PARALLEL REGS 9+10
      [{
        result: "parallelRegs",
        func: parseMultipleLineDataShareAxis,
        type: "multipleLineData",
        details: ["Regs", "Regs-1d"],
      }],
      [], //don't delete
      //PARALLEL INCIDENT 13+14
      [{
        result: "incidentCount",
        func: parseMultipleLineDataShareAxisWithoutAgg,
        type: "multipleLineData",
        details: ["Incident", "Incident-1d"],
      }],
      [], //don't delete
      //DISTINCT IP 15
      [{ result: "distinctIP", func: parseAggDistinct }],
      //DISTINCT URI 16
      [{ result: "distinctURI", func: parseAggDistinct }],
      // DOMAINS STATISTICS 17
      [{
        result: "blacklistStats",
        func: parseMultipleData,
        attrs: ["attrs.hostname", "blacklisted"],
      }],
      //FILTRED PACKETS
      [{ result: "filtredPackets", func: parseAggData }],
      //ratio blacklisted:processed
      [{ result: "blacklistedRatio", func: parseRatio }],
      //ratio whitelisted:processed
      [{ result: "whitelistedRatio", func: parseRatio }],
      //severity
      [{ result: "severity", func: parseListData, attrs: ["severity"] }],
    ],
  }, false);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        {charts["# CALLS"] && (
          <div className="col-auto">
            <ValueChart data={chartsData.sumCallEnd} name={"# CALLS"} />
          </div>
        )}
        {charts["# ATTEMPTS"] &&
          (
            <div className="col-auto">
              <ValueChart
                data={chartsData.sumCallAttempt}
                name={"# ATTEMPTS"}
              />
            </div>
          )}
        {charts["SUM DURATION"] &&
          (
            <div className="col-auto">
              <ValueChart data={chartsData.durationSum} name={"SUM DURATION"} />
            </div>
          )}
        {charts["ASR (%)"] &&
          (
            <div className="col-auto">
              <ValueChart
                data={chartsData.answerSeizureRatio}
                name={"ASR (%)"}
              />
            </div>
          )}
        {charts["AVG DURATION"] &&
          (
            <div className="col-auto">
              <ValueChart data={chartsData.avgDuration} name={"AVG DURATION"} />
            </div>
          )}
        {charts["DISTINCT IP"] &&
          (
            <div className="col-auto">
              <ValueChart data={chartsData.distinctIP} name={"DISTINCT IP"} />
            </div>
          )}
        {charts["DISTINCT URI"] &&
          (
            <div className="col-auto">
              <ValueChart data={chartsData.distinctURI} name={"DISTINCT URI"} />
            </div>
          )}
        {charts["# FILTRED PACKETS"] &&
          (
            <div className="col-auto">
              <ValueChart
                data={chartsData.filtredPackets}
                name={"# FILTRED PACKETS"}
              />
            </div>
          )}
        {charts["BLACKLISTED RATIO"] &&
          (
            <div className="col-auto">
              <ValueChart
                data={chartsData.blacklistedRatio}
                name={"BLACKLISTED RATIO"}
              />
            </div>
          )}
        {charts["WHITELISTED RATIO"] &&
          (
            <div className="col-auto">
              <ValueChart
                data={chartsData.whitelistedRatio}
                name={"WHITELISTED RATIO"}
              />
            </div>
          )}
      </div>
      {charts["TYPE DATE HEATMAP"] &&
        (
          <div className="row no-gutters">
            <TimedateHeatmap
              data={chartsData.typeDateHeatmap}
              marginLeft={150}
              id="dateHeatmap"
              name={"TYPE DATE HEATMAP"}
              field={"attrs.type"}
              units={"count"}
            />
          </div>
        )}
      <div className="row no-gutters">
        {charts["BLACKLIST STATISTICS"] &&
          (
            <div className="col-5" style={{ "marginRight": "4px" }}>
              <MultivalueChart
                data={chartsData.blacklistStats}
                field="attrs.hostname"
                id="blacklistStats"
                title={"BLACKLIST STATISTICS"}
                name1={"hostname"}
                name2={"MAX"}
                name3={"MIN"}
              />
            </div>
          )}
        {charts["SEVERITY"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.severity}
              name={"SEVERITY"}
              field={"severity"}
            />
          </div>
        )}
      </div>
      <div className="row no-gutters">
        {charts["PARALLEL CALLS"] &&
          (
            <div className="col-10 pr-1 mr-0">
              <MultipleAreaChart
                data={chartsData.parallelCalls}
                name={"PARALLEL CALLS"}
                id={"parallelCalls"}
                units={"count"}
              />
            </div>
          )}
        {charts["ACTUAL CALLS"] &&
          (
            <div className="col-2 px-1">
              <CountUpChart
                data={getLastValueInInterval(chartsData.parallelCalls, 1)}
                name={"ACTUAL CALLS"}
                biggerFont={"biggerFont"}
                dataAgo={getLastValueInInterval(
                  chartsData.parallelCalls,
                  0,
                )}
              />
            </div>
          )}
      </div>
      <div className="row no-gutters">
        {charts["PARALLEL REGS"] &&
          (
            <div className="col-10 pr-1 mr-0">
              <MultipleAreaChart
                data={chartsData.parallelRegs}
                name={"PARALLEL REGS"}
                id={"parallelRegs"}
                units={"count"}
              />
            </div>
          )}
        {charts["ACTUAL REGS"] &&
          (
            <div className="col-2 px-1">
              <CountUpChart
                data={getLastValueInInterval(chartsData.parallelRegs, 1)}
                name={"ACTUAL REGS"}
                biggerFont={"biggerFont"}
                dataAgo={getLastValueInInterval(
                  chartsData.parallelRegs,
                  0,
                )}
              />
            </div>
          )}
      </div>
      <div className="row no-gutters">
        {charts["INCIDENTS"] && (
          <div className="col-10 pr-1 mr-0">
            <MultipleAreaChart
              data={chartsData.incidentCount}
              name={"INCIDENTS"}
              units={"count"}
              id={"incidentCount"}
            />
          </div>
        )}
        {charts["INCIDENTS ACTUAL"] &&
          (
            <div className="col-2 px-1">
              <CountUpChart
                data={getLastValueInInterval(chartsData.incidentCount, 1)}
                name={"INCIDENTS ACTUAL"}
                biggerFont={"biggerFont"}
                dataAgo={getLastValueInInterval(
                  chartsData.incidentCount,
                  0,
                )}
              />
            </div>
          )}
      </div>
    </div>
  );
}

export default HomeCharts;
