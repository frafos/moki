import RealmTable from "./RealmTable";
import RealmCharts from "./RealmCharts";
import FilterBar from "../../bars/FilterBar.jsx";

function Realm({ hostnames, tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <RealmCharts hostnames={hostnames} />
      <RealmTable tags={tags} />
    </div>
  );
}

export default Realm;
