import DiagnosticsTable from "./DiagnosticsTable";
import DiagnosticsCharts from "./DiagnosticsCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar";

function Diagnostics({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <DiagnosticsCharts />
      <DiagnosticsTable tags={tags} />
    </div>
  );
}

export default Diagnostics;
