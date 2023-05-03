/*
Class to get data for all charts iin Call dashboard
*/
import TopologyChart from "@charts/topology_chart.jsx";
import Heatmap from "@charts/heatmap_chart.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseDateHeatmap,
  parseHeatmapData,
  parseTopologyData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function ConnectivityCharts() {
  const { chartsData, isLoading } = useDashboardData("connectivity/charts", {
    functors: [
      //FROM TO
      [{ result: "fromTo", func: parseTopologyData }],
      //CONNECTION FAILURE RATIO
      [{ result: "failure", func: parseHeatmapData }],
      //NUMBER OF CALL-ATTEMPTS
      [{ result: "callAtempts", func: parseDateHeatmap }],
      //DURATION
      [{ result: "duration", func: parseHeatmapData }],
      //NUMBER OF CALL-ENDS
      [{ result: "callEnds", func: parseDateHeatmap }],
    ],
  }, false);

  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}{" "}
      <div className="row no-gutters">
        <div className="col">
          <TopologyChart
            data={chartsData.fromTo}
            name={"FROM TO"}
            width={width - 300}
            height={300}
            units={"count"}
            field1={"attrs.from.keyword"}
            field2={"attrs.to.keyword"}
            id="topologyChart"
          />
        </div>

        <div className="col">
          <Heatmap
            data={chartsData.callEnds}
            marginLeft={"250"}
            id="callEnds"
            name={"NUMBER OF CALL ENDs"}
            units={"count"}
            marginBottom={250}
            width={width - 300}
            field2={"attrs.from.keyword"}
            field={"attrs.to.keyword"}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.failure}
            marginLeft={"250"}
            id="failure"
            name={"CONNECTION FAILURE RATIO "}
            width={width - 300}
            field2={"attrs.to.keyword"}
            units={"%"}
            field={"attrs.from.keyword"}
            marginBottom={250}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.callAtempts}
            marginLeft={"250"}
            id="callAtempts"
            name={"NUMBER OF CALL-ATTEMPTS"}
            width={width - 300}
            marginBottom={250}
            field={"attrs.to.keyword"}
            field2={"attrs.from.keyword"}
            units={"count"}
          />
        </div>{" "}
        <div className="col">
          <Heatmap
            data={chartsData.duration}
            marginLeft={"250"}
            id="duration"
            name={"DURATION OF CALLS"}
            width={width - 300}
            marginBottom={250}
            field={"attrs.to.keyword"}
            field2={"attrs.from.keyword"}
          />
        </div>
      </div>
    </div>
  );
}

export default ConnectivityCharts;
