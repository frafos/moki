import ConnectivityCharts from "./ConnectivityCharts";
import FilterBar from "../../bars/FilterBar";

function Connectivity({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <ConnectivityCharts />
    </div>
  );
}

export default Connectivity;
