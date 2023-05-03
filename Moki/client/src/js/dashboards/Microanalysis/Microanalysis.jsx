import MicroanalysisCharts from "./MicroanalysisCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar.jsx";

function Microanalysis({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <MicroanalysisCharts />
    </div>
  );
}

export default Microanalysis;
