
//render all data from json as a list

import React, {
    Component
} from 'react';

class MonitoringListChart extends Component {

render() {

    var data = this.props.data;
    var rows = [];
    if(this.props.data && this.props.data !== 0){
            var keys =Object.keys(data);
                 for(var i = 0; i < keys.length; i++){
                     var key = keys[i];
                     rows.push(
                           <tr key={key}>
                                    <td className="filtertd" > 
                                        {key}
                                    </td>
                                     <td className="filtertd" > 
                                        {data[key]}
                                     </td>
                            </tr>
                     );    
            }        
    }
    else {
      rows.push(
                <tr key="key"><td className="filtertd"> - 
                    </td>
                </tr>
            );
    }
    return (
        <div className="MonitoringListChart chart">
            <table>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
        )
    }
}

export default MonitoringListChart;