/*
Class to get data for all charts iin Call dashboard
*/

import LoadingScreenCharts from "../../helpers/LoadingScreenCharts";
import MultipleLineChart from "@charts/multipleLine_chart";
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
            <MultipleLineChart
              id="callsByHost"
              hostnames={chartsData.hostnames}
              data={chartsData.callsByHost}
              name={"MAX CALLS BY HOST"}
              ticks={3}
            />
          </div>
        )}
        {charts["MAX REGS BY HOST"] && (
          <div className="col-6 px-1">
            <MultipleLineChart
              id="regsByHost"
              hostnames={chartsData.hostnames}
              data={chartsData.regsByHost}
              name={"MAX REGS BY HOST"}
              ticks={3}
            />
          </div>
        )}
        {charts["MAX CALL STARTS BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLineChart
                id="callStartsByHost"
                hostnames={chartsData.hostnames}
                data={chartsData.callStartsByHost}
                name={"MAX CALL STARTS BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["RELAYED RTP BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="relayedRtpByHost"
                hostnames={chartsData.hostnames}
                data={chartsData.relayedRtpByHost}
                name={"RELAYED RTP BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["TX BYTES BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLineChart
                id="txBytesByHost"
                hostnames={chartsData.hostnames}
                data={chartsData.txBytesByHost}
                name={"TX BYTES BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["RX PACKET BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="rxPacketByHost"
                hostnames={chartsData.hostnames}
                data={chartsData.rxPacketByHost}
                name={"RX PACKET BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["TX PACKET BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLineChart
                id="txPacketByHost"
                hostnames={chartsData.hostnames}
                data={chartsData.txPacketByHost}
                name={"TX PACKET BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["RX BYTES BY INTERFACE"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="rxBytesByInterface"
                field="type_instance"
                hostnames={chartsData.hostnames}
                data={chartsData.rxBytesByInterface}
                name={"RX BYTES BY INTERFACE"}
                ticks={3}
              />
            </div>
          )}
        {charts["TX BYTES BY INTERFACE"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLineChart
                id="txBytesByInterface"
                field="type_instance"
                hostnames={chartsData.hostnames}
                data={chartsData.txBytesByInterface}
                name={"TX BYTES BY INTERFACE"}
                ticks={3}
              />
            </div>
          )}
        {charts["RX PACKETS BY INTERFACE"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="rxPacketByInterface"
                field="type_instance"
                hostnames={chartsData.hostnames}
                data={chartsData.rxPacketByInterface}
                name={"RX PACKETS BY INTERFACE"}
                ticks={3}
              />
            </div>
          )}
        {charts["TX PACKETS BY INTERFACE"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLineChart
                id="txPacketByInterface"
                field="type_instance"
                hostnames={chartsData.hostnames}
                data={chartsData.txPacketByInterface}
                name={"TX PACKETS BY INTERFACE"}
                ticks={3}
              />
            </div>
          )}
        {charts["IPS ON FW BLACKLIST BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="blacklist"
                hostnames={chartsData.hostnames}
                data={chartsData.blacklist}
                name={"IPS ON FW BLACKLIST BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["IPS ON FW GREYLIST BY HOST"] &&
          (
            <div className="col-6 pr-1">
              <MultipleLineChart
                id="greylist"
                hostnames={chartsData.hostnames}
                data={chartsData.greylist}
                name={"IPS ON FW GREYLIST BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["IPS ON FW WHITELIST BY HOST"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="whitelist"
                hostnames={chartsData.hostnames}
                data={chartsData.whitelist}
                name={"IPS ON FW WHITELIST BY HOST"}
                ticks={3}
              />
            </div>
          )}
        {charts["PACKET DROP ALERT COUNTERS"] &&
          (
            <div className="col-6 px-1">
              <MultipleLineChart
                id="dropAlert"
                hostnames={chartsData.hostnames}
                data={chartsData.dropAlert}
                name={"PACKET DROP ALERT COUNTERS"}
                ticks={3}
              />
            </div>
          )}
      </div>
    </div>
  );
}

export default NetworkCharts;
