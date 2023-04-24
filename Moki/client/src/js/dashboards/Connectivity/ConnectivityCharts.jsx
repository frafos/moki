/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TopologyChart from '@charts/topology_chart.jsx';
import Heatmap from '@charts/heatmap_chart.jsx';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import { parseHeatmapData, parseDateHeatmap, parseTopologyData } from '../../../es-response-parser';

class ConnectivityCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "connectivity/charts",
            fromTo: [],
            failure: [],
            callAtempts: [],
            duration: [],
            callEnds: [],
            isLoading: true
        };
        this.callBacks = {
            functors: [
                //FROM TO 
                [{ result: 'fromTo', func: parseTopologyData }],

                //CONNECTION FAILURE RATIO 
                [{ result: 'failure', func: parseHeatmapData }],

                //NUMBER OF CALL-ATTEMPTS 
                [{ result: 'callAtempts', func: parseDateHeatmap }],

                //DURATION 
                [{ result: 'duration', func: parseHeatmapData }],

                //NUMBER OF CALL-ENDS 
                [{ result: 'callEnds', func: parseDateHeatmap }]
            ]
        };
    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        } <div className="row no-gutters" >
                <div className="col" >
                    <TopologyChart data={
                        this.state.fromTo
                    }
                        name={
                            "FROM TO"
                        }
                        width={
                            (store.getState().width - 300)
                        }
                        height={
                            300
                        }
                        units={"count"}
                        field1={"attrs.from.keyword"}
                        field2={"attrs.to.keyword"}
                        id="topologyChart"
                    />  </div>

                <div className="col" >
                    <Heatmap data={
                        this.state.callEnds
                    }
                        marginLeft={
                            "250"
                        }
                        id="callEnds"
                        name={
                            "NUMBER OF CALL ENDs"
                        }
                        units={"count"}
                        marginBottom={
                            250
                        }
                        width={
                            store.getState().width - 300
                        }
                        field2={
                            "attrs.from.keyword"
                        }
                        field={
                            "attrs.to.keyword"
                        }
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.failure
                    }
                        marginLeft={
                            "250"
                        }
                        id="failure"
                        name={
                            "CONNECTION FAILURE RATIO "
                        }
                        width={
                            store.getState().width - 300
                        }
                        field2={
                            "attrs.to.keyword"
                        }
                        units={"%"}
                        field={
                            "attrs.from.keyword"
                        }
                        marginBottom={
                            250
                        }
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.callAtempts
                    }
                        marginLeft={
                            "250"
                        }
                        id="callAtempts"
                        name={
                            "NUMBER OF CALL-ATTEMPTS"
                        }
                        width={
                            store.getState().width - 300
                        }
                        marginBottom={
                            250
                        }
                        field={
                            "attrs.to.keyword"
                        }
                        field2={
                            "attrs.from.keyword"
                        }
                        units={"count"}
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.duration
                    }
                        marginLeft={
                            "250"
                        }
                        id="duration"
                        name={
                            "DURATION OF CALLS"
                        }
                        width={
                            store.getState().width - 300
                        }
                        marginBottom={
                            250
                        }
                        field={
                            "attrs.to.keyword"
                        }
                        field2={
                            "attrs.from.keyword"
                        }
                    />  </div> </div> </div>
        );
    }
}

export default ConnectivityCharts;
