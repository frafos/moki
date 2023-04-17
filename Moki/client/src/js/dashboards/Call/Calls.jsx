import React, {
    Component
} from 'react';


import CallsTable from './CallsTable';
import CallCharts from './CallCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar';

class Calls extends Component {     
    render() {
        return (
           <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar tags={this.props.tags}/>
                <TypeBar/>
                <CallCharts  />
                <CallsTable  tags={this.props.tags} />
            </div>
                       
        );
    }
}

export default Calls;
