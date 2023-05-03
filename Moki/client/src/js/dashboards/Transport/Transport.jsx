import TransportTable from "./TransportTable";
import TransportCharts from "./TransportCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar";

function Transport({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <TransportCharts />
      <TransportTable tags={tags} />
    </div>
  );
}

export default Transport;
