/*
Class to get data for all charts iin Call dashboard
*/
import TimedateStackedChart from "@charts/timedate_stackedbar.jsx";
import GeoIpMap from "@charts/geoip_map.jsx";
import DonutChart from "@charts/donut_chart.jsx";
import ListChart from "@charts/list_chart.jsx";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import {
  parseAggCities,
  parseBucketData,
  parseListData,
  parseStackedbarTimeData,
} from "../../../es-response-parser";

import { useDashboardData } from "@hooks/useDashboardData";
import { useSelector } from "react-redux";

function SecurityCharts() {
  const { chartsData, charts, isLoading } = useDashboardData(
    "security/charts",
    {
      functors: [
        //DISTRIBUTION GEOIP MAP
        [{ result: "geoipMap", func: parseAggCities }],
        //EVENT SECURITY TIMELINE
        [{
          result: "eventRegsTimeline",
          func: parseStackedbarTimeData,
          attrs: ["attrs.type"],
        }],
        //EVENTS BY IP ADDR
        [{
          result: "eventsByIP",
          func: parseListData,
          attrs: ["attrs.source"],
        }],
        //TOP SUBNETS /24
        [{
          result: "subnets",
          func: parseListData,
          attrs: ["attrs.sourceSubnets"],
        }],
        //EVENTS BY COUNTRY
        [{
          result: "eventsByCountry",
          func: parseListData,
          attrs: ["geoip.src.iso_code"],
        }],
        //SECURITY TYPES EVENTS
        [{
          result: "typesCount",
          func: parseBucketData,
          attrs: ["attrs.type"],
        }],
        //DISTRIBUTION HASH GEOIP MAP
        [{ result: "geoipHashMap", func: parseAggCities }],
        //EVENTS BY SIGNATURE
        [{
          result: "signature",
          func: parseListData,
          attrs: ["sip.request.sig"],
        }],
      ],
    },
  );

  //render GUI
  const width = useSelector((state) => state.persistent.width);
  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      {charts["EVENTS OVER TIME"] && (
        <div className="row no-gutters">
          <TimedateStackedChart
            id="eventsOverTime"
            data={chartsData.eventRegsTimeline}
            name={"EVENTS OVER TIME"}
            units={"count"}
            keys={"security"}
            width={width - 300}
          />
        </div>
      )}
      {charts["SECURITY GEO EVENTS"] && (
        <div className="row no-gutters">
          <div className="col-auto">
            <GeoIpMap
              data={chartsData.geoipMap}
              dataNotShown={chartsData.geoipHashMap}
              type={"geoip"}
              name={"SECURITY GEO EVENTS"}
              units={"count"}
              width={width - 300}
            />
          </div>
        </div>
      )}
      <div className="row no-gutters">
        {charts["TYPES"] && (
          <div className="col-auto" style={{ "marginRight": "5px" }}>
            <DonutChart
              data={chartsData.typesCount}
              units={"count"}
              name={"TYPES"}
              id="types"
              width={width / 4 + 30}
              legendSize={20}
              height={200}
              field="attrs.type"
            />
          </div>
        )}
        {charts["EVENTS BY IP ADDR"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.eventsByIP}
              name={"EVENTS BY IP ADDR"}
              field={"attrs.source"}
              type="list"
            />
          </div>
        )}
        {charts["TOP SUBNETS"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.subnets}
              name={"TOP SUBNETS"}
              type="list"
              field={"attrs.sourceSubnets"}
            />
          </div>
        )}
        {charts["EVENTS BY COUNTRY"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.eventsByCountry}
              name={"EVENTS BY COUNTRY"}
              type="list"
              field={"geoip.country_code2"}
            />
          </div>
        )}
        {charts["EVENTS BY SIGNATURE"] && (
          <div className="col-auto">
            <ListChart
              data={chartsData.signature}
              name={"EVENTS BY SIGNATURE"}
              type="list"
              field={"sip.request.sig"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityCharts;
