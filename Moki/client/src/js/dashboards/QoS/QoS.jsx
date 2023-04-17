import React, {
    Component
} from 'react';


import QoSTable from './QoSTable';
import QoSCharts from './QoSCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar';


class QoS extends Component {

    render() {
        return (
            <div className="container-fluid" style={{ "paddingRight": "0" }}>
                <FilterBar tags={this.props.tags} />
                <TypeBar />
                <QoSCharts />
                <QoSTable tags={this.props.tags} />
            </div>

        );
    }
}

export default QoS;
