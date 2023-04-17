import React, {
    Component
} from 'react';


import MonitoringCharts from './MonitoringCharts';

class Monitoring extends Component {
    render() {
        return (
            <div className="container">
                <MonitoringCharts />
            </div>
                       
        );
    }
}

export default Monitoring;
