import React, { Component } from 'react';
import { createFilter } from '../../gui';

import filter from "/icons/filter.png";
import unfilter from "/icons/unfilter.png";
import emptyIcon from "/icons/empty_small.png";

class MultiListChart extends Component {
     constructor(props) {
        super(props);
        this.filter = this.filter.bind(this);
    }

filter(event){ 
     createFilter(event.currentTarget.getAttribute('field') +":\""+event.currentTarget.getAttribute('value')+"\"");
}
    
    
unfilter(event){ 
     createFilter("NOT "+event.currentTarget.getAttribute('field') +":\""+event.currentTarget.getAttribute('value')+"\"");
}
  
    
niceNumber(nmb){
         if(nmb){
        return nmb.toLocaleString();
         }
         else return nmb;
    }
    
 roundNumber(nmb){
         if(nmb){
        return nmb.toFixed(2).toLocaleString();
         }
         else return nmb;
    }
    
    

row(list){
    var rows =[];
    
     //special list for monitoring dahsboard
    if(list.device_name){
        rows.push(<th key={list.device_name}> {list.device_name}</th>
             );
        
    var keys =Object.keys(list);
         for(var i = 0; i < keys.length; i++){
             var key = keys[i];
             rows.push(
                   <tr key={key}>
                            <td className="filtertd"> 
                                {key}
                            </td>
                             <td className="filtertd"> 
                                {list[key]}
                             </td>
                    </tr>
             
             );    
        }
        return rows;
    }
    else{
        
    var name = list.key;
    var sum = list.doc_count;
    list = list.agg.buckets;
    rows.push(<th className="filtertd filterToggleActiveWhite" key={name}> 
                    <span className="filterToggle">            
                        <img onClick={this.filter} field="attrs.sbc" value={name} className="icon" alt="filterIcon" src={filter} />
                        <img field="attrs.sbc" value={name}  onClick={this.unfilter} className="icon" alt="unfilterIcon" src={unfilter} /> 
                    </span>
              
              {name}</th>
             );
        for(i = 0; i < list.length; i++){
             rows.push(
                   <tr key ={list[i].key}>
                            <td  className="filtertd listChart filterToggleActiveWhite" id={list[i].key} >  <span className="filterToggle">            
                                <img onClick={this.filter} field={this.props.field} value={list[i].key} className="icon" alt="filterIcon" src={filter} />
                                <img field={this.props.field} value={list[i].key}  onClick={this.unfilter} className="icon" alt="unfilterIcon" src={unfilter} /> 
                                </span>
                                {list[i].key}
                            </td>
                            <td className="alignRight listChart"> {this.niceNumber(list[i].doc_count)}</td>
                            <td className="alignRight listChart tab">{this.roundNumber(list[i].doc_count/sum*100)+"%"}</td>
                      </tr>
               
                 
             
             );    
        }
   return rows;
}
    
}
    
render() {
    return (
        <div className="tableChart chart">
         <h3 className="alignLeft title" style={{"float": "inherit"}}>{this.props.name}</h3>
       {this.props.data && this.props.data.length > 0 &&
          <table>
          <tbody>
        {this.props.data.map((items, keys) => {
                return this.row(items)
        })}</tbody>
           </table>
        }
        {this.props.data && this.props.data.length === 0 &&
        <table style={{"minWidth": "17em"}}>
          <tbody>
           <tr><td className="filtertd"><span></span></td></tr>
            <tr><td className="filtertd"> <span className="noDataIcon"> <img alt="nodata" src={emptyIcon}  className="noDataList" />  </span></td></tr>
          </tbody>
        </table>
        }
        
        </div>
        )
  }
}

export default MultiListChart;
