/*
Class to get data for all charts iin Call dashboard
*/
import Value from "@charts/Value";
import MultipleLine from "@charts/MultipleLine";
import TimedateStackedChart from "@charts/timedate_stackedbar";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import GeoIpMap from "@charts/geoip_map";
import DonutChart from "@charts/donut_chart";
import ListChart from "@charts/list_chart";

import {
  parseAggCities,
  parseBucketData,
  parseListData,
  parseMultipleLineDataShareAxis,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData, getLastValueInInterval } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

const REGISTRATION_FUNCTORS = [
  //GEOIP MAP 0
  [{ result: "geoipMap", func: parseAggCities }],
  //EVENT REGS TIMELINE 1
  [{
    result: "eventRegsTimeline",
    func: parseStackedbarTimeData,
    attrs: ["attrs.type"],
  }],
  //USER-AGENTS IN REG. NEW 2
  [{
    result: "userAgents",
    func: parseBucketData,
    attrs: ["attrs.from-ua"],
  }],
  //TOP REG. EXPIRED 3
  [{
    result: "topRegExpired",
    func: parseListData,
    attrs: ["attrs.from"],
  }],
  //TRANSPORT PROTOCOL 4
  [{
    result: "transportProtocol",
    func: parseBucketData,
    attrs: ["attrs.transport"],
  }],
  //PARALLEL REGS 5+6
  [{
    result: "parallelRegs",
    attrs: ["attrs.hostname"],
    func: parseMultipleLineDataShareAxis,
    type: "multipleLineData",
    details: ["Regs", "Regs-1d"],
  }],
  [],
  //ACTUALL REGS 7
  [],
  //DISTRIBUTION HASH GEOIP MAP 8
  [{ result: "geoipHashMap", func: parseAggCities }],
  //TYPES DISTRIBUTIONS
  [{ result: "types", func: parseBucketData, attrs: ["attrs.type"] }],
];

function RegistrationCharts() {
  const { chartsData, isLoading } = useDashboardData(
    "registration/charts",
    { functors: REGISTRATION_FUNCTORS },
  );
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
          keys={"registration"}
          width={width - 300}
        />
      </div>
      <div className="row no-gutters">
        <div className="col-10 pr-1 mr-0">
          <MultipleLine
            area
            height={220}
            data={chartsData.parallelRegs}
            name={"PARALLEL REGS"}
          />
        </div>
        <div className="col-2 px-1">
          <Value
            data={getLastValueInInterval(chartsData.parallelRegs, 1)}
            name={"ACTUAL REGS"}
            biggerFont={"biggerFont"}
          />
        </div>
      </div>
      <div className="row no-gutters">
        <div className="col">
          <GeoIpMap
            data={chartsData.geoipMap}
            dataNotShown={chartsData.geoipHashMap}
            type={"geoip"}
            units={"count"}
            width={width - 300}
            name="REGISTRATIONS MAP"
          />
        </div>
      </div>{" "}
      <div className="row no-gutters">
        <div className="col">
          <DonutChart
            data={chartsData.types}
            units={"count"}
            name={"TYPES"}
            field={"attrs.type"}
            id="types"
            width={400}
            height={170}
            legendSize={150}
          />
        </div>
        <div className="col">
          <DonutChart
            data={chartsData.userAgents}
            units={"count"}
            name={"USER-AGENTS IN REG. NEW"}
            field={"attrs.from-ua"}
            id="userAgents"
            width={(width / 2) - 100}
            height={170}
            legendSize={350}
          />
        </div>
        <div className="col">
          <DonutChart
            data={chartsData.transportProtocol}
            name={"TRANSPORT PROTOCOL"}
            units={"count"}
            field={"attrs.transport"}
            id="transportProtocol"
            width={500}
            height={170}
            legendSize={50}
          />
        </div>
        <div className="col">
          <ListChart
            data={chartsData.topRegExpired}
            name={"TOP REG. EXPIRED"}
            field={"attrs.from.keyword"}
          />
        </div>
      </div>
    </div>
  );
}

export default RegistrationCharts;
