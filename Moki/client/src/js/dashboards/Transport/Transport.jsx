import React, {
    Component
} from 'react';


import TransportTable from './TransportTable';
import TransportCharts from './TransportCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar';

class Transport extends Component {
    render() {
        return (
            <div className="container-fluid" style={{ "paddingRight": "0" }}>
                <FilterBar tags={this.props.tags} />
                <TypeBar />
                <TransportCharts />
                <TransportTable tags={this.props.tags} />
            </div>

        );
    }
}

export default Transport;
