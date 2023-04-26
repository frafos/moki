import React, {
    Component
} from 'react';


import MonitoringCharts from './MonitoringCharts';

class Monitoring extends Component {
    render() {
        return (
            <div className="container-fluid pr-0 mr-0">
                <MonitoringCharts />
            </div>
                       
        );
    }
}

export default Monitoring;
