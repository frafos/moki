import React, {
    Component
} from 'react';


import ExceededTable from './ExceededTable';
import ExceededCharts from './ExceededCharts';
import FilterBar from '../../bars/FilterBar';
import TypeBar from '../../bars/Typebar';

class Exceeded extends Component {
    render() {
        return (
           <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar tags={this.props.tags} />
                <TypeBar/>
                <ExceededCharts  />
                <ExceededTable tags={this.props.tags}   />
            </div>
                       
        );
    }
}

export default Exceeded;
