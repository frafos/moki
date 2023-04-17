import React, {
    Component
} from 'react';
import HomeCharts from './HomeCharts';
import FilterBar from '../../bars/FilterBar';

class Home extends Component {
 
    render() {
        return (
            <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar tags={this.props.tags} />
                <HomeCharts />
            </div>
     
        );
    }
}

export default Home;
