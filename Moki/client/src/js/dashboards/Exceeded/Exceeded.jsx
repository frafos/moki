import ExceededTable from "./ExceededTable";
import ExceededCharts from "./ExceededCharts";
import FilterBar from "../../bars/FilterBar";
import TypeBar from "../../bars/Typebar";

function Exceeded({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <ExceededCharts />
      <ExceededTable tags={tags} />
    </div>
  );
}

export default Exceeded;
