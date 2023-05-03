/*
Class to get data for all charts iin Call dashboard
*/
import BarChart from "@charts/bar_chart.jsx";
import TimedateStackedChart from "@charts/timedate_stackedbar.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseHistogramData,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function QoSCharts() {
  const { chartsData, isLoading } = useDashboardData("qos/charts", {
    functors: [
      //QoS HISTOGRAM
      [{ result: "QoSHistogram", func: parseHistogramData }],

      //MoS STATS
      [{ result: "MoSStats", func: parseStackedbarTimeData }],
    ],
  }, false);

  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        <BarChart
          data={chartsData.QoSHistogram}
          units={"count"}
          id="QoSHistogram"
          bottomMargin={100}
          type="histogram"
          name={"QoS HISTOGRAM"}
          width={width - 300}
        />{" "}
        <TimedateStackedChart
          id="MoSStats"
          units={"count"}
          data={chartsData.MoSStats}
          name={"MoS STATS"}
          keys={["*-2.58", "2.58-3.1", "3.1-3.6", "3.6-4.03", "4.03-*"]}
          width={width - 300}
        />
      </div>
    </div>
  );
}

export default QoSCharts;
