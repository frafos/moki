import React, {
    Component
} from 'react';
import RestrictedCharts from './RestrictedCharts';
import RestrictedTable from './RestrictedTable';
import RestrictedExceededTable from './RestrictedExceededTable';
import store from "../../store/index";
import { assignType } from "../../actions/index";
import TypeBar from '../../bars/Typebar';

class Restricted extends Component {
    constructor(props) {
        super(props);
        //no types needed in Home dashboard, delete them from redux
        store.dispatch( assignType(""));

    }
    
    render() {
        return (
            <div className="container-fluid">
             <TypeBar/>
                <RestrictedCharts />
                <RestrictedExceededTable tags={this.props.tags}  />
                <RestrictedTable tags={this.props.tags}  />
               
            </div>
     
        );
    }
}

export default Restricted;
