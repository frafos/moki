/*
Class to get data for all charts iin Call dashboard
*/
import TopologyChart from "@charts/topology_chart";
import Heatmap from "@charts/heatmap_chart";
import TimedateHeatmap from "@charts/TimedateHeatmap";
import Value from "@charts/Value";
import MultivalueChart from "@charts/multivalue_chart";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseAggData,
  parseDateHeatmap,
  parseDateHeatmapAgg,
  parseHeatmapData,
  parseHeatmapDataAgg,
  parseHeatmapDataAgg3,
  parseMultipleData,
  parseQueryStringData,
  parseStatesCA,
  parseTopologyData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function ConnectivityCACharts() {
  const { chartsData, isLoading } = useDashboardData("connectivityCA/charts", {
    functors: [
      //FROM TO CA
      [{
        result: "fromToCA",
        func: parseTopologyData,
        attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"],
      }],
      //DURATION SUM
      [{
        result: "durationSum",
        func: parseAggData,
        attrs: ["attrs.duration"],
      }],
      //SUM CALL-END
      [{ result: "sumCallEnd", func: parseQueryStringData }],
      //SUM CALL-Attempts
      [{ result: "sumCallAttempt", func: parseQueryStringData }],
      //CONNECTION FAILURE RATIO CA
      [{
        result: "failureCA",
        func: parseHeatmapDataAgg,
        attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"],
      }],
      //NUMBER OF CALL-ATTEMPS CA
      [{
        result: "callAtemptsCA",
        func: parseDateHeatmap,
        attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"],
      }],
      //NUMBER OF CALL-ENDA CA
      [{
        result: "callEndsCA",
        func: parseDateHeatmap,
        attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"],
      }],
      //ERROR CODE ANALYSIS
      [{
        result: "codeAnalysis",
        func: parseHeatmapData,
        attrs: ["attrs.sip-code", "attrs.src_ca_id"],
      }],
      //CA RATIO HISTORY
      [{
        result: "ratioHistory",
        func: parseDateHeatmapAgg,
        attrs: ["attrs.dst_ca_id"],
      }],
      //CA AVAILABILITY
      [{ result: "caAvailability", func: parseStatesCA }],
      //DURATION CA
      [{
        result: "durationCA",
        func: parseHeatmapDataAgg3,
        attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"],
      }],
      //DESTINATIONS CAs STATISTICS
      [{
        result: "statsCA",
        func: parseMultipleData,
        attrs: ["attrs.dst_ca_id", "attrs.duration"],
      }],
      //SOURCE CAs STATISTICS
      [{
        result: "sourceStatsCA",
        func: parseMultipleData,
        attrs: ["attrs.src_ca_id", "attrs.duration"],
      }],
      //NUMBER OF CALL-START CA
      [{ result: "sumCallStart", func: parseQueryStringData }],
      //AVG MoS
      [{
        result: "avgMoS",
        func: parseDateHeatmapAgg,
        attrs: ["attrs.dst_ca_id", "attrs.rtp-MOScqex-avg"],
      }],
    ],
  }, false);

  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}{" "}
      <div className="row no-gutters">
        <div className="col-auto">
          <Value data={chartsData.sumCallEnd} name={"ENDs"} />
        </div>{" "}
        <div className="col-auto">
          <Value data={chartsData.sumCallAttempt} name={"ATTEMPTs"} />
        </div>
        <div className="col-auto">
          <Value data={chartsData.sumCallStart} name={"STARTs"} />
        </div>
        <div className="col-auto">
          <Value data={chartsData.durationSum} name={"SUM DURATION"} />
        </div>
      </div>
      <div className="row no-gutters">
        <MultivalueChart
          data={chartsData.statsCA}
          field="attrs.dst_ca_id"
          id="statsCA"
          title={"DESTINATIONS CAs STATISTICS"}
          name1={"CA name"}
          name2={"AVG failure (%)"}
          name3={"Duration"}
          name4={"Ends"}
          name5={"Attempts"}
          name6={"Starts"}
        />
      </div>
      <div className="row no-gutters">
        <MultivalueChart
          data={chartsData.sourceStatsCA}
          field="attrs.src_ca_id"
          id="srcStatsCA"
          title={"SOURCE CAs STATISTICS"}
          name1={"CA name"}
          name2={"AVG failure (%)"}
          name3={"Duration"}
          name4={"Ends"}
          name5={"Attempts"}
          name6={"Starts"}
        />
      </div>
      <div className="row no-gutters">
        <TopologyChart
          data={chartsData.fromToCA}
          name={"FROM TO CA"}
          type="topology"
          width={width - 300}
          field1={"attrs.src_ca_id"}
          field2={"attrs.dst_ca_id"}
          id="topologyChart"
          height={400}
          units={"count"}
        />
      </div>{" "}
      <div className="row no-gutters">
        <div className="col">
          <Heatmap
            data={chartsData.failureCA}
            type="4agg"
            marginLeft={"150"}
            id="failureCA"
            name={"CONNECTION FAILURE RATIO CA"}
            width={(width - 300) / 2}
            field={"attrs.src_ca_id"}
            field2={"attrs.dst_ca_id"}
            marginBottom={80}
            units={"AVG %"}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.callAtemptsCA}
            marginLeft={"150"}
            type="2agg"
            id="callAtemptsCA"
            name={"NUMBER OF CALL-ATTEMPTS CA"}
            width={(width - 300) / 2}
            field2={"attrs.dst_ca_id"}
            field={"attrs.src_ca_id"}
            marginBottom={80}
            units={"count"}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.callEndsCA}
            type="2agg"
            marginLeft={"150"}
            id="callEndsCA"
            name={"NUMBER OF CALL-ENDS CA"}
            width={(width - 300) / 2}
            field2={"attrs.dst_ca_id"}
            field={"attrs.src_ca_id"}
            marginBottom={80}
            units={"count"}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.durationCA}
            marginLeft={"150"}
            id="durationCA"
            name={"AVG DURATION OF CALLS CA"}
            type={"4agg"}
            width={(width - 300) / 2}
            field2={"attrs.dst_ca_id"}
            field={"attrs.src_ca_id"}
            marginBottom={80}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.codeAnalysis}
            type="4aggdoc"
            marginLeft={150}
            id="codeAnalysis"
            name={"ERROR CODE ANALYSIS"}
            width={width - 300}
            field2={"attrs.src_ca_id"}
            field={"attrs.sip-code"}
            marginBottom={80}
            units={"count"}
          />
        </div>
        <section className="w-100">
          <div className="col">
            <TimedateHeatmap
              data={chartsData.avgMoS}
              marginLeft={"150"}
              id="avgMoS"
              name={"AVG MoS"}
              width={width - 300}
              field={"attrs.rtp-MOScqex-avg"}
              units={"AVG"}
            />
          </div>{" "}
          <div className="col">
            <TimedateHeatmap
              data={chartsData.ratioHistory}
              marginLeft={"150"}
              id="ratioHistory"
              name={"CA RATIO HISTORY"}
              width={width - 300}
              field={"attrs.src_ca_id"}
              units={"AVG %"}
            />
          </div>{" "}
          <div className="col">
            <TimedateHeatmap
              data={chartsData.caAvailability}
              marginLeft={"150"}
              id="caAvailability"
              name={"CA AVAILABILITY"}
              width={width - 300}
              field={"attrs.dest_ca_name"}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default ConnectivityCACharts;
