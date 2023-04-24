/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TimedateStackedChart from '@charts/timedate_stackedbar.jsx';
import DonutChart from '@charts/donut_chart.jsx';
import ListChart from '@charts/list_chart.jsx';
import ValueChart from '@charts/value_chart.jsx';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import { parseListData, parseStackedbarTimeData, 
    parseBucketData, parseQueryStringData } from '../../../es-response-parser';

class ExceededCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "exceeded/charts",
            eventCallsTimeline: [],
            exceededCount: [],
            exceededType: [],
            topOffenders: [],
            subnets: [],
            ipAddress: [],
            charts: [],
            exceededBy: [],
            isLoading: true
        };
        this.callBacks = {
            functors: [
                //EVENT CALLS TIMELINE
                [{ result: 'eventCallsTimeline', func: parseStackedbarTimeData, attrs:["exceeded"] }],

                //EXCEEDED COUNT
                [{ result: 'exceededCount', func: parseQueryStringData }],

                //EXCEEDED TYPE
                [{ result: 'exceededType', func: parseBucketData, attrs:["exceeded"]  }],

                //TOP OFFENDERS
                [{ result: 'topOffenders', func: parseListData, attrs:["attrs.from"]  }],

                //EVENTS BY IP ADDR 
                [{ result: 'ipAddress', func: parseListData, attrs:["attrs.source"]   }],

                //TOP SUBNETS /24 EXCEEDED
                [{ result: 'subnets', func: parseListData, attrs:["attrs.sourceSubnets"]  }],

                 //EXCEEDED TYPES
                 [{ result: 'exceededBy', func: parseListData, attrs:["exceeded-by"]  }]
            ]
        };
    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        } <div className="row no-gutters" >
                {this.state.charts["EVENTS OVER TIME"] && <div className="col-auto" style={{"marginRight": "5px"}}>
                    <TimedateStackedChart id="eventsOverTime"
                        data={this.state.eventCallsTimeline}
                        units={"count"}
                        name={"EVENTS OVER TIME"}
                        keys={"exceeded"}
                        width={store.getState().width - 400}
                    />  </div>
                }
                {this.state.charts["INCIDENTS COUNT"] && <div className="col-auto">
                    <ValueChart data={this.state.exceededCount}
                        name={"INCIDENTS COUNT"}
                        biggerFont={"biggerFont"}
                    />  </div>}
                {this.state.charts["EXCEEDED TYPE"] && <div className="col-auto" style={{"marginRight": "5px"}}>
                    <DonutChart data={this.state.exceededType}
                        units={"count"}
                        name={"EXCEEDED TYPE"}
                        id="exceededType"
                        height={170}
                        field="exceeded" />
                </div>}
                {this.state.charts["EXCEEDED BY"] && <div className="col-auto" >
                    <ListChart data={this.state.exceededBy}
                        name={"EXCEEDED BY"}
                        field={"exceeded-by"}
                    />  </div>
                }
                {this.state.charts["TOP OFFENDERS"] && <div className="col-auto" >
                    <ListChart data={this.state.topOffenders}
                        name={"TOP OFFENDERS"}
                        field={"attrs.from.keyword"}
                    />  </div>}
                {this.state.charts["TOP SUBNETS /24 EXCEEDED"] && <div className="col-auto">
                    <ListChart data={this.state.subnets}
                        name={"TOP SUBNETS /24 EXCEEDED"}
                        field={"attrs.sourceSubnets"}
                    />  </div>}
                {this.state.charts["EXCEEDED EVENTS BY IP ADDR"] && <div className="col-auto" >
                    <ListChart data={this.state.ipAddress}
                        name={"EXCEEDED EVENTS BY IP ADDR"}
                        field={"attrs.source"}
                    />  </div>
                }
            </div> </div>
        );
    }
}

export default ExceededCharts;
