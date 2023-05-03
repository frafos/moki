import SecurityTable from "./SecurityTable";
import SecurityCharts from "./SecurityCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar.jsx";

function Security(props) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={props.tags} />
      <TypeBar />
      <SecurityCharts />
      <SecurityTable tags={props.tags} />
    </div>
  );
}

export default Security;
