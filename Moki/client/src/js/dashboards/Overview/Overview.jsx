import React, {
    Component
} from 'react';


import OverviewTable from './OverviewTable';
import OverviewCharts from './OverviewCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar.jsx';

class Overview extends Component {
    render() {
        return (
            <div className="container-fluid" style={{"paddingRight": "0"}}>
                    <FilterBar tags={this.props.tags} />
                    <TypeBar/>
                    <OverviewCharts  />
                    <OverviewTable tags={this.props.tags}  />
            </div>
                       
        );
    }
}

export default Overview;
