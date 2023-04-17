import React, {
    Component
} from 'react';
import MicroanalysisCharts from './MicroanalysisCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar.jsx';

class Microanalysis extends Component {
    render() {
        return (
            <div className="container-fluid" style={{"paddingRight": "0"}}>
            <FilterBar tags={this.props.tags} /> 
            <TypeBar/>
                <MicroanalysisCharts />
            </div>
     
        );
    }
}

export default Microanalysis;
