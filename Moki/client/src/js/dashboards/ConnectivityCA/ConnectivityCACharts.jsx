/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TopologyChart from '@charts/topology_chart.jsx';
import Heatmap from '@charts/heatmap_chart.jsx';
import TimedateHeatmap from '@charts/timedate_heatmap.jsx';
import ValueChart from '@charts/value_chart.jsx';
import MultivalueChart from '@charts/multivalue_chart.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import store from "../../store/index";
import { parseHeatmapData, parseDateHeatmap, parseDateHeatmapAgg, 
    parseStatesCA, parseHeatmapDataAgg3, parseQueryStringData, parseAggData, 
    parseTopologyData, parseMultipleData, parseHeatmapDataAgg } from '../../../es-response-parser';

class ConnectivityCACharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "connectivityCA/charts",
            fromToCA: [],
            sumCallEnd: [],
            sumCallAttempt: [],
            durationSum: [],
            failureCA: [],
            callAtemptsCA: [],
            callEndsCA: [],
            codeAnalysis: [],
            ratioHistory: [],
            caAvailability: [],
            durationCA: [],
            statsCA: [],
            sumCallStart: [],
            avgMoS: [],
            isLoading: true,
        };
        this.callBacks = {
            functors: [
                //FROM TO CA
                [{ result: 'fromToCA', func: parseTopologyData, attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"] }],

                //DURATION SUM
                [{ result: 'durationSum', func: parseAggData, attrs: ["attrs.duration"] }],

                //SUM CALL-END
                [{ result: 'sumCallEnd', func: parseQueryStringData }],

                //SUM CALL-Attempts  
                [{ result: 'sumCallAttempt', func: parseQueryStringData }],

                //CONNECTION FAILURE RATIO CA
                [{ result: 'failureCA', func: parseHeatmapDataAgg, attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"] }],

                //NUMBER OF CALL-ATTEMPS CA
                [{ result: 'callAtemptsCA', func: parseDateHeatmap, attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"] }],

                //NUMBER OF CALL-ENDA CA
                [{ result: 'callEndsCA', func: parseDateHeatmap, attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"] }],

                //ERROR CODE ANALYSIS
                [{ result: 'codeAnalysis', func: parseHeatmapData, attrs: ["attrs.sip-code", "attrs.src_ca_id"] }],

                //CA RATIO HISTORY
                [{ result: 'ratioHistory', func: parseDateHeatmapAgg, attrs: ["attrs.dst_ca_id"] }],

                //CA AVAILABILITY
                [{ result: 'caAvailability', func: parseStatesCA }],

                //DURATION CA
                [{ result: 'durationCA', func: parseHeatmapDataAgg3, attrs: ["attrs.src_ca_id", "attrs.dst_ca_id"] }],

                //DESTINATIONS CAs STATISTICS
                [{ result: 'statsCA', func: parseMultipleData, attrs: ["attrs.dst_ca_id", "attrs.duration"] }],

                //SOURCE CAs STATISTICS
                [{ result: 'sourceStatsCA', func: parseMultipleData, attrs: ["attrs.src_ca_id", "attrs.duration"] }],

                //NUMBER OF CALL-START CA
                [{ result: 'sumCallStart', func: parseQueryStringData }],

                //AVG MoS
                [{ result: 'avgMoS', func: parseDateHeatmapAgg, attrs: ["attrs.dst_ca_id", "attrs.rtp-MOScqex-avg"] }]
            ]
        };
    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        } <div className="row no-gutters" >
                <div className="col-auto" >
                    <ValueChart data={
                        this.state.sumCallEnd
                    }
                        name={
                            "ENDs"
                        } />  </div> <div className="col-auto" >
                    <ValueChart data={
                        this.state.sumCallAttempt
                    }
                        name={
                            "ATTEMPTs"
                        }
                    />  </div>
                <div className="col-auto" >
                    <ValueChart data={
                        this.state.sumCallStart
                    }
                        name={
                            "STARTs"
                        }
                    />  </div>
                <div className="col-auto" >
                    <ValueChart data={
                        this.state.durationSum
                    }
                        name={
                            "SUM DURATION"
                        }
                    />  </div>  </div>
            <div className="row no-gutters" >
                <MultivalueChart data={
                    this.state.statsCA
                }
                    field="attrs.dst_ca_id"
                    id="statsCA"
                    title={
                        "DESTINATIONS CAs STATISTICS"
                    }
                    name1={
                        "CA name"
                    }
                    name2={
                        "AVG failure (%)"
                    }
                    name3={
                        "Duration"
                    }
                    name4={
                        "Ends"
                    }
                    name5={
                        "Attempts"
                    }
                    name6={
                        "Starts"
                    }
                />  </div>
            <div className="row no-gutters">
                <MultivalueChart data={
                    this.state.sourceStatsCA
                }
                    field="attrs.src_ca_id"
                    id="srcStatsCA"
                    title={
                        "SOURCE CAs STATISTICS"
                    }
                    name1={
                        "CA name"
                    }
                    name2={
                        "AVG failure (%)"
                    }
                    name3={
                        "Duration"
                    }
                    name4={
                        "Ends"
                    }
                    name5={
                        "Attempts"
                    }
                    name6={
                        "Starts"
                    }
                />
            </div>
            <div className="row no-gutters" >
                <TopologyChart data={
                    this.state.fromToCA
                }
                    name={
                        "FROM TO CA"
                    }
                    type="topology"
                    width={
                        store.getState().width - 300
                    }
                    field1={"attrs.src_ca_id"}
                    field2={"attrs.dst_ca_id"}
                    id="topologyChart"
                    height={
                        400
                    }
                    units={
                        "count"
                    }
                />  </div> <div className="row no-gutters" >
                <div className="col" >
                    <Heatmap data={
                        this.state.failureCA
                    }
                        type="4agg"
                        marginLeft={
                            "150"
                        }
                        id="failureCA"
                        name={
                            "CONNECTION FAILURE RATIO CA"
                        }
                        width={
                            (store.getState().width - 300) / 2
                        }
                        field={
                            "attrs.src_ca_id"
                        }
                        field2={
                            "attrs.dst_ca_id"
                        }
                        marginBottom={
                            80
                        }
                        units={
                            "AVG %"
                        }
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.callAtemptsCA
                    }
                        marginLeft={
                            "150"
                        }
                        type="2agg"
                        id="callAtemptsCA"
                        name={
                            "NUMBER OF CALL-ATTEMPTS CA"
                        }
                        width={
                            (store.getState().width - 300) / 2
                        }
                        field2={
                            "attrs.dst_ca_id"
                        }
                        field={
                            "attrs.src_ca_id"
                        }
                        marginBottom={
                            80
                        }
                        units={
                            "count"
                        }
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.callEndsCA
                    }
                        type="2agg"
                        marginLeft={
                            "150"
                        }
                        id="callEndsCA"
                        name={
                            "NUMBER OF CALL-ENDS CA"
                        }
                        width={
                            (store.getState().width - 300) / 2
                        }
                        field2={
                            "attrs.dst_ca_id"
                        }
                        field={
                            "attrs.src_ca_id"
                        }
                        marginBottom={
                            80
                        }
                        units={
                            "count"
                        }
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.durationCA
                    }
                        marginLeft={
                            "150"
                        }
                        id="durationCA"
                        name={
                            "AVG DURATION OF CALLS CA"
                        }
                        type={"4agg"}
                        width={
                            (store.getState().width - 300) / 2
                        }
                        field2={
                            "attrs.dst_ca_id"
                        }
                        field={
                            "attrs.src_ca_id"
                        }
                        marginBottom={
                            80
                        }
                    />  </div> <div className="col" >
                    <Heatmap data={
                        this.state.codeAnalysis
                    }
                        type="4aggdoc"
                        marginLeft={150}
                        id="codeAnalysis"
                        name={
                            "ERROR CODE ANALYSIS"
                        }
                        width={
                            store.getState().width - 300
                        }
                        field2={
                            "attrs.src_ca_id"
                        }
                        field={
                            "attrs.sip-code"
                        }
                        marginBottom={
                            80
                        }
                        units={
                            "count"
                        }
                    />  </div>
                <div className="col" >
                    <TimedateHeatmap data={
                        this.state.avgMoS
                    }
                        marginLeft={
                            "150"
                        }
                        id="avgMoS"
                        name={
                            "AVG MoS"
                        }
                        width={
                            store.getState().width - 300
                        }
                        field={
                            "attrs.rtp-MOScqex-avg"
                        }
                        units={
                            "AVG"
                        }
                    />
                </div> <div className="col" >
                    <TimedateHeatmap data={
                        this.state.ratioHistory
                    }
                        marginLeft={
                            "150"
                        }
                        id="ratioHistory"
                        name={
                            "CA RATIO HISTORY"
                        }
                        width={
                            store.getState().width - 300
                        }
                        field={
                            "attrs.src_ca_id"
                        }
                        units={
                            "AVG %"
                        }
                    />  </div> <div className="col" >
                    <TimedateHeatmap data={
                        this.state.caAvailability
                    }
                        marginLeft={
                            "150"
                        }
                        id="caAvailability"
                        name={
                            "CA AVAILABILITY"
                        }
                        width={
                            store.getState().width - 300
                        }
                        field={
                            "attrs.dest_ca_name"
                        }
                    />  </div> </div> </div>
        );
    }
}

export default ConnectivityCACharts;
