/*
Class to get data for all charts iin Call dashboard
*/

import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import MultipleLineChart from "@charts/multipleLine_chart";
import { parseMultipleLineData } from "../../../es-response-parser";
import { useDashboardData } from "@hooks/useDashboardData";

function SystemCharts({ hostnames }) {
  const { chartsData, isLoading } = useDashboardData("system/charts", {
    functors: [
      //LOAD-SHORTTERM
      [{ result: "shortterm", func: parseMultipleLineData }],
      //LOAD-midTERM
      [{ result: "midterm", func: parseMultipleLineData }],
      //LOAD-SHORTTERM
      [{ result: "longterm", func: parseMultipleLineData }],
      //MEMORY FREE
      [{ result: "memoryFree", func: parseMultipleLineData }],
      //MEMORY USED
      [{ result: "memoryUsed", func: parseMultipleLineData }],
      //MEMORY CACHED
      [{ result: "memoryCached", func: parseMultipleLineData }],
      //MEMORY BUFFERED
      [{ result: "memoryBuffered", func: parseMultipleLineData }],
      //UAS
      [{ result: "uas", func: parseMultipleLineData }],
      //UAC
      [{ result: "uac", func: parseMultipleLineData }],
      //CPU-USER
      [{ result: "cpuUser", func: parseMultipleLineData }],
      //CPU-SYSTEM
      [{ result: "cpuSystem", func: parseMultipleLineData }],
      //CPU-IDLE
      [{ result: "cpuIdle", func: parseMultipleLineData }],
    ],
  }, false);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        <div className="col-6 pr-1">
          <MultipleLineChart
            id="shortterm"
            data={chartsData.shortterm}
            name={"LOAD-SHORTTERM"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>{" "}
        <div className="col-6 px-1">
          <MultipleLineChart
            id="midterm"
            data={chartsData.midterm}
            name={"LOAD-MIDTERM"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>{" "}
        <div className="col-6 pr-1">
          <MultipleLineChart
            id="longterm"
            data={chartsData.longterm}
            name={"LOAD-LONGTERM"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>{" "}
        <div className="col-6 px-1">
          <MultipleLineChart
            id="memoryFree"
            data={chartsData.memoryFree}
            hostnames={hostnames}
            name={"MEMORY-FREE"}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLineChart
            id="memoryUsed"
            data={chartsData.memoryUsed}
            hostnames={hostnames}
            name={"MEMORY-USED"}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLineChart
            id="memoryCached"
            hostnames={hostnames}
            data={chartsData.memoryCached}
            name={"MEMORY-CACHED"}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLineChart
            id="memoryBuffered"
            data={chartsData.memoryBuffered}
            hostnames={hostnames}
            name={"MEMORY-BUFFERED"}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLineChart
            id="uas"
            data={chartsData.uas}
            name={"UAS SIP trans."}
            hostnames={hostnames}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLineChart
            id="uac"
            data={chartsData.uac}
            name={"UAC SIP trans."}
            hostnames={hostnames}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLineChart
            id="cpuUser"
            data={chartsData.cpuUser}
            hostnames={hostnames}
            name={"CPU-USER"}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLineChart
            id="cpuSystem"
            data={chartsData.cpuSystem}
            hostnames={hostnames}
            name={"CPU-SYSTEM"}
            ticks={3}
          />
        </div>
        <div className="col-6 px-1">
          <MultipleLineChart
            id="cpuIdle"
            data={chartsData.cpuIdle}
            hostnames={hostnames}
            name={"CPU-IDLE"}
            ticks={3}
          />
        </div>
      </div>
    </div>
  );
}

export default SystemCharts;
