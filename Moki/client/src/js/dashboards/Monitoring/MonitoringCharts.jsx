/*
Class to get data for all charts iin Call dashboard
*/

import Value from "@charts/Value";
import CircleChart from "@charts/circle_chart.jsx";
import GaugeChart from "@charts/gauge_chart.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import MultiListChart from "@charts/multiple_list_chart.jsx";
import ListChartMonitoring from "@charts/list_chart_monitoring.jsx";
import MonitoringListChart from "@charts/monitoring_list_chart.jsx";
import { parseTimestamp } from "../../helpers/parseTimestamp";
import { elasticsearchConnection } from "../../../gui";

import SimpleTable from "@charts/table/simple_table";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

function MonitoringCharts() {
  // Initialize the state
  const [isLoading, setIsLoading] = useState(true);
  const [monitorData, setMonitorData] = useState({
    avgResponseTime: 0,
    usedDiskSpace: 0,
    isLoading: true,
    availableDiskSpace: 0,
    cpu: 0,
    heapUsedPercent: 0,
    elasticsearchStatus: "",
    logstashStatus: "",
    loadAverage1m: 0,
    loadAverage5m: 0,
    loadAverage15m: 0,
    memoryBytes: 0,
    memoryUsed: 0,
    disk: 0,
    eventStats: 0,
    indices: [],
    freeMemory: 0,
  });

  const timerange = useSelector((state) => state.filter.timerange);

  useEffect(() => {
    loadData();
  }, [timerange]);

  /*
    Load data from elasticsearch
    get filters, types and timerange from GUI
    */
  const loadData = async () => {
    setIsLoading(true);
    let data;
    let events;

    try {
      data = await elasticsearchConnection("monitoring/charts");
      events = await elasticsearchConnection("monitoring/events");
      //const sbcEventsStats = await elasticsearchConnection("monitoring/sbc");
    } catch (error) {
      console.error("Error receiving data: " + error);
    }

    if (typeof data === "string" && data.includes("ERROR:")) {
      window.notification.showError({ errno: 2, text: data, level: "error" });
      setIsLoading(false);
      return;
    }
    if (typeof events === "string" && events.includes("ERROR:")) {
      window.notification.showError({ errno: 2, text: events, level: "error" });
      setIsLoading(false);
      return;
    }

    const values = {};

    console.log(data);

    //get node name
    if (data && data[0] && data[0].hasOwnProperty("nodes")) {
      let node = Object.keys(data[0].nodes)[0];

      //CPU STATS
      values.cpu = data[0].nodes[node].os.cpu.percent;

      // One-minute load average on the system
      values.loadAverage1m = data[0].nodes[node].os.cpu.load_average["1m"];

      // Five-minute load average on the system
      values.loadAverage5m = data[0].nodes[node].os.cpu.load_average["5m"];

      // 15-minute load average on the system
      values.loadAverage15m = data[0].nodes[node].os.cpu.load_average["15m"];

      //DISK
      //  (Linux only) - Array of disk metrics for each device that is backing an Elasticsearch data path. These disk metrics are probed periodically and averages between the last probe and the current probe are computed.
      values.disk = data[0].nodes[node].fs.io_stats.devices;

      //ELASTICSEARCH STATS
      if (
        data[0].nodes[node].adaptive_selection[node] &&
        data[0].nodes[node].adaptive_selection[node].avg_response_time_ns
      ) {
        //avgResponseTime
        values.avgResponseTime =
          data[0].nodes[node].adaptive_selection[node].avg_response_time_ns /
          1000;
      }

      //used disk space
      if (
        data[0].nodes[node].fs.total.total_in_bytes &&
        data[0].nodes[node].fs.total.available_in_bytes
      ) {
        values.usedDiskSpace = ((data[0].nodes[node].fs.total.total_in_bytes -
          data[0].nodes[node].fs.total.available_in_bytes) /
          data[0].nodes[node].fs.total.total_in_bytes) * 100;
      }

      // available disk space
      if (data[0].nodes[node].fs.total.available_in_bytes) {
        values.availableDiskSpace =
          data[0].nodes[node].fs.total.available_in_bytes /
          1000000;
      }

      // heap used
      if (
        data[0].nodes[node].jvm.mem &&
        data[0].nodes[node].jvm.mem.heap_used_percent
      ) {
        values.heapUsedPercent = data[0].nodes[node].jvm.mem.heap_used_percent;
      }
    }

    if (data && data[1] && data[1].hasOwnProperty("elasticsearch")) {
      //elasticsearch status
      values.elasticsearchStatus = data[1].elasticsearch;

      values.freeMemory = data[1].memoryFree;
      values.memoryBytes = data[1].memoryTotal;

      //LOGSTASH
      //logstash status
      values.logstashStatus = data[1].logstash;

      if (data && data[2] && data[2].hasOwnProperty("indices")) {
        values.indices = data[2].indices;
      }
    }

    // EVENTS
    if (events && events.events) {
      values.eventStats = events.events;
    }

    console.log(new Date() + " MOKI MONITORING: finished parsíng data");
    setMonitorData({ ...monitorData, ...values });
    setIsLoading(false);
  };

  //render GUI
  const columns = [
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ cell }) => {
        const value = cell.getValue();
        return (
          <div>
            {value && parseTimestamp(new Date(parseInt(value)))}
          </div>
        );
      },
      minSize: 200,
    },
    {
      accessorKey: "level",
      header: "Level",
      minSize: 100,
    },
    {
      accessorKey: "text",
      header: "Text",
      minSize: 300,
    },
  ];

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <h4>NOTIFICATIONS</h4>
      <SimpleTable
        columns={columns}
        data={window.notification.getAllNotifications(true)}
      >
      </SimpleTable>
      <h4>CPU</h4>{" "}
      <div className="row no-gutters bottomMargin">
        <div className="col-auto" style={{ "marginRight": "5px" }}>
          <GaugeChart
            data={monitorData.cpu}
            name={"CPU USAGE (%)"}
            id={"used_cpu"}
            width={300}
          />
        </div>
        <div className="col-auto">
          <Value
            data={monitorData.loadAverage1m}
            name={"1-MIN LOAD AVG"}
          />
        </div>
        <div className="col-auto">
          <Value
            data={monitorData.loadAverage5m}
            name={"5-MIN LOAD AVG"}
          />
        </div>{" "}
        <div className="col-auto">
          <Value
            data={monitorData.loadAverage15m}
            name={"15-MIN LOAD AVG"}
          />
        </div>
      </div>
      <h4>MEMORY</h4>{" "}
      <div className="row no-gutters bottomMargin">
        <div className="col-auto">
          <Value data={monitorData.freeMemory} name={"FREE MEMORY (KB)"} />
        </div>
        <div className="col-auto" style={{ "marginLeft": "5px" }}>
          <Value
            data={monitorData.memoryBytes}
            name={"TOTAL MEMORY (KB)"}
          />
        </div>
      </div>{" "}
      <h4>DISK(Linux only)</h4>{" "}
      <div className="row no-gutters bottomMargin">
        <div className="col-auto">
          <MultiListChart data={monitorData.disk} name={"DISK STATS"} />
        </div>
      </div>
      <div className="row no-gutters bottomMargin">
        <span>
          <h4
            style={{
              "marginTop": "20px",
            }}
          >
            LOGSTASH{" "}
            <CircleChart data={monitorData.logstashStatus} id={"logstash"} />
          </h4>

          <div className="col">
            <GaugeChart
              data={monitorData.heapUsedPercent}
              name={"HEAP USED (%)"}
              id={"used_heap"}
              width={300}
            />
          </div>
        </span>{" "}
        <span>
          <h4
            style={{
              "marginTop": "20px",
            }}
          >
            EVENTS STATS
          </h4>

          <MonitoringListChart data={monitorData.eventStats} />
        </span>
      </div>

      <h4>
        ELASTICSEARCH{" "}
        <CircleChart
          data={monitorData.elasticsearchStatus}
          id={"elasticsearch"}
        />
      </h4>
      <div className="row no-gutters bottomMargin">
        <GaugeChart
          data={monitorData.usedDiskSpace}
          name={"USED DISK SPACE (%)"}
          id={"used_disc"}
          width={300}
        />{" "}
        <Value
          data={monitorData.availableDiskSpace}
          name={"AVAILABLE DISK SPACE (MB)"}
        />{" "}
        <Value
          data={monitorData.avgResponseTime}
          name={"AVG RESPONSE (ms)"}
        />
      </div>{" "}
      <div className="row no-gutters bottomMargin">
        <ListChartMonitoring
          data={monitorData.indices}
          name={"INDICES STATS"}
        />
      </div>
    </div>
  );
}

export default MonitoringCharts;
