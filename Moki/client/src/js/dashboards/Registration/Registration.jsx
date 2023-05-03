import RegistrationTable from "./RegistrationTable";
import RegistrationCharts from "./RegistrationCharts";
import TypeBar from "../../bars/Typebar";
import FilterBar from "../../bars/FilterBar";

function Registration({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <TypeBar />
      <RegistrationCharts />
      <RegistrationTable tags={tags} />
    </div>
  );
}

export default Registration;
