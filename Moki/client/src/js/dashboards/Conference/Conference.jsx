import ConferenceTable from "./ConferenceTable";
import ConferenceCharts from "./ConferenceCharts";
import FilterBar from "../../bars/FilterBar";
import TypeBar from "../../bars/Typebar";

function Conference({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <ConferenceCharts />
      <ConferenceTable tags={tags} />
    </div>
  );
}

export default Conference;
