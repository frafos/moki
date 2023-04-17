
//specific case: monitoring indices list data

import React, {
    Component
} from 'react';

class ListChartMonitoring extends Component {

render() {

var data = this.props.data;
var rows = [];
    rows.push(<tr key="th"><th style={{"width": "300px"}}>Index</th><th style={{"width": "200px"}}>Count events</th><th style={{"width": "100px"}}>Segments</th></tr>);
    
    if(this.props.data && this.props.data !== 0){
var indices = Object.keys(this.props.data);
    for(var i =0; i < indices.length; i++){ 
    var key = indices[i];

    if(indices[i] !== ".kibana-6"){
        rows.push(
            <tr key={indices[i]}><td className="filtertd" >{indices[i]}
                </td>
                <td className="filtertd" >
                    {data[key].primaries.docs.count}
                </td>
                <td className="filtertd" >
                    {data[key].primaries.segments.count}
                </td>
            </tr>
        );
        }
    }
}
else {
  rows.push(
            <tr><td className="filtertd" > - 
                </td>
                <td className="filtertd" >
                    0
                </td>
                <td className="filtertd" >
                    0
                </td>
            </tr>
        );
    }
    
    
    return (

        <div className="listChartMonitoring chart">
         <h3 className="alignLeft title" style={{"float": "inherit"}}>{this.props.name}</h3>
            <table>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
        )
    }
}

export default ListChartMonitoring;