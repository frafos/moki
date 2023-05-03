import ConnectivityCACharts from "./ConnectivityCACharts";
import ConnectivityCATable from "./ConnectivityCATable";
import FilterBar from "../../bars/FilterBar";

function ConnectivityCA({ srcRealms, dstRealms, tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} srcRealms={srcRealms} dstRealms={dstRealms} />
      <ConnectivityCACharts />
      <ConnectivityCATable />
    </div>
  );
}

export default ConnectivityCA;
