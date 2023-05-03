/*
Class to get data for all charts iin Call dashboard
*/
import TimedateStackedChart from "@charts/timedate_stackedbar.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import { parseStackedbarTimeData } from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function DiagnosticsCharts() {
  const { chartsData, isLoading } = useDashboardData(
    "diagnostics/charts",
    {
      functors: [
        //EVENT Diagnostic TIMELINE
        [{
          result: "eventDiagnosticTimeline",
          func: parseStackedbarTimeData,
          attrs: ["attrs.type"],
        }],
      ],
    },
  );

  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        <TimedateStackedChart
          data={chartsData.eventDiagnosticTimeline}
          id="eventsOverTime"
          name={"EVENTS OVER TIME"}
          keys={"diagnostics"}
          units={"count"}
          width={width - 300}
        />
      </div>
    </div>
  );
}

export default DiagnosticsCharts;
