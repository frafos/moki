/*
Class to get data for all charts iin Call dashboard
*/
import TimedateStackedChart from "@charts/timedate_stackedbar.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import { parseStackedbarTimeData } from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function TransportCharts() {
  const { chartsData, isLoading } = useDashboardData("transport/charts", {
    functors: [
      [{ result: "eventRegsTimeline", func: parseStackedbarTimeData }],
    ],
  });

  const width = useSelector((state) => state.persistent.width);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}{" "}
      <div className="row no-gutters">
        <TimedateStackedChart
          id="eventsOverTime"
          data={chartsData.eventRegsTimeline}
          units={"count"}
          name={"EVENTS OVER TIME"}
          keys={"transport"}
          width={width - 300}
        />
      </div>
    </div>
  );
}

export default TransportCharts;
