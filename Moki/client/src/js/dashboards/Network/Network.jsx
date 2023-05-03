import NetworkTable from "./NetworkTable";
import NetworkCharts from "./NetworkCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar.jsx";

function Network({ hostnames }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar />
      <TypeBar />
      <NetworkCharts hostnames={hostnames} />
      <NetworkTable />
    </div>
  );
}

export default Network;
