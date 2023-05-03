import OverviewTable from "./OverviewTable";
import OverviewCharts from "./OverviewCharts";
import TypeBar, { loadTypes } from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar.jsx";

function Overview({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <OverviewCharts />
      <OverviewTable tags={tags} />
    </div>
  );
}

export default Overview;
