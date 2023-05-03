import CallsTable from "./CallsTable";
import CallCharts from "./CallCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar";

function Calls({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <CallCharts />
      <CallsTable tags={tags} />
    </div>
  );
}

export default Calls;
