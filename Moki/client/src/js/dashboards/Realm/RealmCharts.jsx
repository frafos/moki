/*
Class to get data for all charts iin Call dashboard
*/

import { useDashboardData } from "@hooks/useDashboardData";
import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import MultipleLine from "@charts/MultipleLine";
import { parseMultipleLineData } from "../../../es-response-parser";

function RealmCharts({ hostnames }) {
  const { chartsData, isLoading } = useDashboardData("realm/charts", {
    functors: [
      //MAX CALLS FROM BY HOST
      [{ result: "maxCallsFromByHost", func: parseMultipleLineData }],
      //MAX CALLS To BY HOST
      [{ result: "maxCallsToByHost", func: parseMultipleLineData }],
      ////MAX CALLS FROM BY REALM
      [{ result: "maxCallsFromByrealm", func: parseMultipleLineData }],
      //MAX CALLS TO BY REALM
      [{ result: "maxCallsToByrealm", func: parseMultipleLineData }],
      //MAX START CALLS FROM BY HOST
      [{ result: "maxStartCallsFromByHost", func: parseMultipleLineData }],
      //MAX START CALLS To BY HOST
      [{ result: "maxStartCallsToByHost", func: parseMultipleLineData }],
      //MAX START CALLS FROM BY REALM
      [{ result: "maxStartCallsFromByrealm", func: parseMultipleLineData }],
      //MAX START CALLS TO BY REALM
      [{ result: "maxStartCallsToByrealm", func: parseMultipleLineData }],
      //RTP RELAYED TO BY HOST
      [{ result: "rtpToByHost", func: parseMultipleLineData }],
      //RTP RELAYED FROM BY HOST
      [{ result: "rtpFromByHost", func: parseMultipleLineData }],
      //RTP RELAYED TO BY REALM
      [{ result: "rtpToByRealm", func: parseMultipleLineData }],
      //RTP RELAYED FROM BY REALM
      [{ result: "rtpFromByRealm", func: parseMultipleLineData }],
    ],
  }, false);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}{" "}
      <div className="row no-gutters">
        <div className="col-6 pr-1">
          <MultipleLine
            id="maxCallsFromByHost"
            hostnames={hostnames}
            data={chartsData.maxCallsFromByHost}
            name={"MAX CALLS FROM BY HOST"}
            ticks={3}
          />
        </div>
        <div className="col-6 px-1">
          <MultipleLine
            id="maxCallsToByHost"
            data={chartsData.maxCallsToByHost}
            name={"MAX CALLS TO BY HOST"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>
        <div className="col-6 pr-1">
          <MultipleLine
            id="maxCallsFromByrealm"
            data={chartsData.maxCallsFromByrealm}
            hostnames={chartsData.realm}
            name={"MAX CALLS FROM BY REALM"}
            field={"attrs.realm"}
            ticks={3}
          />
        </div>
        <div className="col-6 px-1">
          <MultipleLine
            id="maxCallsToByrealm"
            data={chartsData.maxCallsToByrealm}
            name={"MAX CALLS TO BY REALM"}
            field={"attrs.realm"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLine
            id="maxStartCallsFromByHost"
            data={chartsData.maxStartCallsFromByHost}
            hostnames={hostnames}
            name={"MAX START CALLS FROM BY HOST"}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLine
            id="maxStartCallsToByHost"
            data={chartsData.maxStartCallsToByHost}
            hostnames={hostnames}
            name={"MAX START CALLS TO BY HOST"}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLine
            id="maxStartCallsFromByrealm"
            data={chartsData.maxStartCallsFromByrealm}
            hostnames={hostnames}
            name={"MAX START CALLS FROM BY REALM"}
            field={"attrs.realm"}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLine
            id="maxStartCallsToByrealm"
            data={chartsData.maxStartCallsToByrealm}
            hostnames={hostnames}
            name={"MAX START CALLS TO BY REALM"}
            field={"attrs.realm"}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLine
            id="rtpToByHost"
            data={chartsData.rtpToByHost}
            hostnames={hostnames}
            name={"RTP RELAYED TO BY HOST"}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLine
            id="rtpFromByHost"
            data={chartsData.rtpFromByHost}
            name={"RTP RELAYED FROM BY HOST"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>

        <div className="col-6 pr-1">
          <MultipleLine
            id="rtpToByRealm"
            data={chartsData.rtpToByRealm}
            name={"RTP RELAYED TO BY REALM"}
            field={"attrs.realm"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>

        <div className="col-6 px-1">
          <MultipleLine
            id="rtpFromByRealm"
            data={chartsData.rtpFromByRealm}
            name={"RTP RELAYED FROM BY REALM"}
            field={"attrs.realm"}
            hostnames={hostnames}
            ticks={3}
          />
        </div>
      </div>
    </div>
  );
}

export default RealmCharts;
