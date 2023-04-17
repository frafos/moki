import React, {
    Component
} from 'react';


import ConferenceTable from './ConferenceTable';
import ConferenceCharts from './ConferenceCharts';
import FilterBar from '../../bars/FilterBar';
import TypeBar from '../../bars/Typebar';

class Conference extends Component {     
    render() {
        return (
           <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar  tags={this.props.tags}/>
                <TypeBar/>
                <ConferenceCharts  />
                <ConferenceTable   tags={this.props.tags} />
            </div>
                       
        );
    }
}

export default Conference;
