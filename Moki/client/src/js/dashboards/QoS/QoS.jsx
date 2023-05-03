import QoSTable from "./QoSTable";
import QoSCharts from "./QoSCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar";

function QoS({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <QoSCharts />
      <QoSTable tags={tags} />
    </div>
  );
}

export default QoS;
