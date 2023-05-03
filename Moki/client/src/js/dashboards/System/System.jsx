import SystemTable from "./SystemTable";
import SystemCharts from "./SystemCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar";

function System({ hostnames, tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <SystemCharts hostnames={hostnames} />
      <SystemTable tags={tags} />
    </div>
  );
}

export default System;
