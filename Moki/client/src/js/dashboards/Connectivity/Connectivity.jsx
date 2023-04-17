import React, {
    Component
} from 'react';


import ConnectivityCharts from './ConnectivityCharts';
import FilterBar from '../../bars/FilterBar';

class Connectivity extends Component {
    render() {
        return (
           <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar tags={this.props.tags} />
                <ConnectivityCharts />
            </div>
                       
        );
    }
}

export default Connectivity;
