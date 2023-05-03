import HomeCharts from "./HomeCharts";
import FilterBar from "../../bars/FilterBar";

function Home({ tags }) {
  return (
    <div className="container-fluid" style={{ "paddingRight": "0" }}>
      <FilterBar tags={tags} />
      <HomeCharts />
    </div>
  );
}

export default Home;
