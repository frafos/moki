import RestrictedCharts from "./RestrictedCharts";
import RestrictedTable from "./RestrictedTable";
import RestrictedExceededTable from "./RestrictedExceededTable";
import TypeBar from "../../bars/Typebar";

function Restricted({ tags }) {
  return (
    <div className="container-fluid">
      <TypeBar />
      <RestrictedCharts />
      <RestrictedExceededTable tags={tags} />
      <RestrictedTable tags={tags} />
    </div>
  );
}

export default Restricted;
