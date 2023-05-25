/*
Class to get data for all charts iin Call dashboard
*/

import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import MultipleLine from "@charts/MultipleLine";
import { parseMultipleLineData } from "../../../es-response-parser";
import { useDashboardData } from "@hooks/useDashboardData";

function NetworkCharts({ hostnames }) {
  const { chartsData, charts, isLoading } = useDashboardData("network/charts", {
    functors: [
      //CALLS BY HOST
      [{ result: "callsByHost", func: parseMultipleLineData }],
      //REGS BY HOST
      [{ result: "regsByHost", func: parseMultipleLineData }],
      //CALL STARTS BY HOST
      [{ result: "callStartsByHost", func: parseMultipleLineData }],
      //RELAYED RTP BY HOST
      [{ result: "relayedRtpByHost", func: parseMultipleLineData }],
      //RX BYTES BY HOST
      [{ result: "rxBytesByHost", func: parseMultipleLineData }],
      //TX BYTES BY HOST
      [{ result: "txBytesByHost", func: parseMultipleLineData }],
      //RX PACKET BY HOST
      [{ result: "rxPacketByHost", func: parseMultipleLineData }],
      //TX PACKET BY HOST
      [{ result: "txPacketByHost", func: parseMultipleLineData }],
      //RX BYTES BY INTERFACE
      [{ result: "rxBytesByInterface", func: parseMultipleLineData }],
      //TX BYTES BY INTERFACE
      [{ result: "txBytesByInterface", func: parseMultipleLineData }],
      //RX PACKETS BY INTERFACE
      [{ result: "rxPacketByInterface", func: parseMultipleLineData }],
      //TX PACKETS BY INTERFACE
      [{ result: "txPacketByInterface", func: parseMultipleLineData }],
      //IPS ON FW BLACKLIST BY HOST
      [{ result: "blacklist", func: parseMultipleLineData }],
      //IPS ON FW GREYLIST BY HOST
      [{ result: "greylist", func: parseMultipleLineData }],
      //IPS ON FW WHITELIST BY HOST
      [{ result: "whitelist", func: parseMultipleLineData }],
    ],
  }, false);

  return (
    <div>
      {isLoading && <LoadingScreenCharts />}
      <div className="row no-gutters">
        {charts["MAX CALLS BY HOST"] && (
          <div className="col-6 pr-1">
            <MultipleLine
              field={"attrs.hostname"}
              hostnames={hostnames}
              data={chartsData.callsByHost}
              name={"MAX CALLS BY HOST"}
            />
          </div>
        )}
        {charts["MAX REGS BY HOST"] && (
          <div className="col-6 px-1">
            <MultipleLine
              field={"attrs.hostname"}
              hostnames={hostnames}
              data={chartsData.regsByHost}
              name={"MAX REGS BY HOST"}
            />
          </div>
        )}
        {charts["MAX CALL STARTS BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.callStartsByHost}
                name={"MAX CALL STARTS BY HOST"}
              />
            </div>
          )}
        {charts["RELAYED RTP BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.relayedRtpByHost}
                name={"RELAYED RTP BY HOST"}
              />
            </div>
          )}
        {charts["TX BYTES BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.txBytesByHost}
                name={"TX BYTES BY HOST"}
              />
            </div>
          )}
        {charts["RX PACKET BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.rxPacketByHost}
                name={"RX PACKET BY HOST"}
              />
            </div>
          )}
        {charts["TX PACKET BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.txPacketByHost}
                name={"TX PACKET BY HOST"}
              />
            </div>
          )}
        {charts["RX BYTES BY INTERFACE"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field="type_instance"
                hostnames={hostnames}
                data={chartsData.rxBytesByInterface}
                name={"RX BYTES BY INTERFACE"}
              />
            </div>
          )}
        {charts["TX BYTES BY INTERFACE"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLine
                field="type_instance"
                hostnames={hostnames}
                data={chartsData.txBytesByInterface}
                name={"TX BYTES BY INTERFACE"}
              />
            </div>
          )}
        {charts["RX PACKETS BY INTERFACE"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field="type_instance"
                hostnames={hostnames}
                data={chartsData.rxPacketByInterface}
                name={"RX PACKETS BY INTERFACE"}
              />
            </div>
          )}
        {charts["TX PACKETS BY INTERFACE"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLine
                field="type_instance"
                hostnames={hostnames}
                data={chartsData.txPacketByInterface}
                name={"TX PACKETS BY INTERFACE"}
              />
            </div>
          )}
        {charts["IPS ON FW BLACKLIST BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.blacklist}
                name={"IPS ON FW BLACKLIST BY HOST"}
              />
            </div>
          )}
        {charts["IPS ON FW GREYLIST BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.greylist}
                name={"IPS ON FW GREYLIST BY HOST"}
              />
            </div>
          )}
        {charts["IPS ON FW WHITELIST BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.whitelist}
                name={"IPS ON FW WHITELIST BY HOST"}
              />
            </div>
          )}
        {charts["PACKET DROP ALERT COUNTERS"] &&
          (
            <div className="col-6 px-1">
              <MultipleLine
                field={"attrs.hostname"}
                hostnames={hostnames}
                data={chartsData.dropAlert}
                name={"PACKET DROP ALERT COUNTERS"}
              />
            </div>
          )}
      </div>
    </div>
  );
}

export default NetworkCharts;
