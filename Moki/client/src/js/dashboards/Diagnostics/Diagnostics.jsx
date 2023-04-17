import React, {
    Component
} from 'react';


import DiagnosticsTable from './DiagnosticsTable';
import DiagnosticsCharts from './DiagnosticsCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar';


class Diagnostics extends Component {
    render() {
        return (
                   <div className="container-fluid" style={{"paddingRight": "0"}}>
                            <FilterBar tags={this.props.tags} />
                            <TypeBar/>
                            <DiagnosticsCharts />
                            <DiagnosticsTable tags={this.props.tags}  />
            </div>
                       
        );
    }
}

export default Diagnostics;
