/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';
import Dashboard from '../Dashboard.js';
import TimedateHeatmap from '@charts/timedate_heatmap.jsx';
import CountUpChart from '@charts/count_chart.jsx';
import ValueChart from '@charts/value_chart.jsx';
import MultipleAreaChart from '@charts/multipleArea_chart';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import MultivalueChart from '@charts/multivalue_chart.jsx';
import ListChart from '@charts/list_chart.jsx';
import { parseQueryStringData, parseDateHeatmap,parseRatio, parseAggData, 
    parseListData, parseAggSumBucketData, parseMultipleData, 
    parseAggDistinct, parseMultipleLineDataShareAxis, 
    parseMultipleLineDataShareAxisWithoutAgg } from '../../../es-response-parser';

class HomeCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "home/charts",
            sumCallAttempt: [],
            sumCallEnd: [],
            durationSum: [],
            answerSeizureRatio: [],
            callingCountries: [],
            avgDuration: [],
            typeDateHeatmap: [],
            parallelCalls: [],
            parallelRegs: [],
            callsActual: [],
            filtredPackets: [],
            regsActuall: [],
            incidentCount: [],
            distinctIP: [],
            distinctURI: [],
            charts: [],
            blacklistStats: [],
            blacklistedRatio: [],
            whitelistedRatio: [],
            severity: [],
            isLoading: true
        }

        this.callBacks = {
            functors: [
                //SUM CALL-END 0
                [{ result: 'sumCallEnd', func: parseQueryStringData }],
                //SUM CALL-ATTEMPT 1
                [{ result: 'sumCallAttempt', func: parseQueryStringData }],
                [],
                ////DURATION SUM  3
                [{ result: 'durationSum', func: parseAggData }],
                //ANSWER-SEIZURE RATIO 4
                [{ result: 'answerSeizureRatio', func: parseAggSumBucketData }],
                //AVG DURATION 5
                [{ result: 'avgDuration', func: parseAggData }],
                //DATE HEATMAP 6
                [{ result: 'typeDateHeatmap', func: parseDateHeatmap, attrs: ["attrs.type", "attrs.type"] }],
                //PARALLEL CALLS 7+8
                [{ result: 'parallelCalls', func: parseMultipleLineDataShareAxis, type: "multipleLineData", details: ["Calls", "Calls-1d"] }],
                [], //don't delete
                //PARALLEL REGS 9+10
                [{ result: 'parallelRegs', func: parseMultipleLineDataShareAxis, type: "multipleLineData", details: ["Regs", "Regs-1d"] }],
                [], //don't delete
                //PARALLEL INCIDENT 13+14
                [{ result: 'incidentCount', func: parseMultipleLineDataShareAxisWithoutAgg, type: "multipleLineData", details: ["Incident", "Incident-1d"] }],
                [], //don't delete
                //DISTINCT IP 15
                [{ result: 'distinctIP', func: parseAggDistinct }],
                //DISTINCT URI 16
                [{ result: 'distinctURI', func: parseAggDistinct }],
                // DOMAINS STATISTICS 17
                [{ result: 'blacklistStats', func: parseMultipleData, attrs: ["attrs.hostname", "blacklisted"] }],
                //FILTRED PACKETS
                [{ result: 'filtredPackets', func: parseAggData }],
                //ratio blacklisted:processed
                [{ result: 'blacklistedRatio', func: parseRatio }],
                //ratio whitelisted:processed
                [{ result: 'whitelistedRatio', func: parseRatio }],
                //severity
                [{ result: 'severity', func: parseListData, attrs: ["severity"] }],


            ]
        }
    }

    //special parsing data - last bucket from different parsing function
    //i = 0 - time interval ago;   i = 1 actual
    getLastValueInInterval(data, i) {
        if (data && data.length > 0 && data[1].values.length > 0) {
            //get last time interval
            if (i === 0) {
                var lastValue = data[1].values[data[1].values.length - 2];
                if (lastValue) {
                    return lastValue.value;
                }
                else {
                    return 0;
                }
            }
            else {
                lastValue = data[1].values[data[1].values.length - 1];
                if (lastValue) {
                    return lastValue.value
                }
                else {
                    return 0;
                }
            }
        }
        return 0;
    }

    render() {
        console.log(this.state.blacklistStats);
        return (
            <div>
                {this.state.isLoading && <LoadingScreenCharts />}
                <div className="row no-gutters">
                    {this.state.charts["# CALLS"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.sumCallEnd
                        } name={"# CALLS"} />
                    </div>
                    }
                    {this.state.charts["# ATTEMPTS"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.sumCallAttempt
                            } name={"# ATTEMPTS"} />
                        </div>
                    }
                    {this.state.charts["SUM DURATION"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.durationSum
                            } name={"SUM DURATION"} />
                        </div>
                    }
                    {this.state.charts["ASR (%)"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.answerSeizureRatio
                            } name={"ASR (%)"} />
                        </div>
                    }
                    {this.state.charts["AVG DURATION"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.avgDuration
                            } name={"AVG DURATION"} />
                        </div>
                    }
                    {this.state.charts["DISTINCT IP"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.distinctIP
                            } name={"DISTINCT IP"} />
                        </div>
                    }
                    {this.state.charts["DISTINCT URI"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.distinctURI
                            } name={"DISTINCT URI"} />
                        </div>
                    }
                    {this.state.charts["# FILTRED PACKETS"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.filtredPackets
                            } name={"# FILTRED PACKETS"} />
                        </div>
                    }
                    {this.state.charts["BLACKLISTED RATIO"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.blacklistedRatio
                            } name={"BLACKLISTED RATIO"} />
                        </div>
                    }
                    {this.state.charts["WHITELISTED RATIO"] &&
                        <div className="col-auto">
                            <ValueChart data={
                                this.state.whitelistedRatio
                            } name={"WHITELISTED RATIO"} />
                        </div>
                    }
                </div>
                {this.state.charts["TYPE DATE HEATMAP"] &&
                    <div className="row no-gutters">
                        <TimedateHeatmap data={
                            this.state.typeDateHeatmap
                        } marginLeft={150} id="dateHeatmap" name={"TYPE DATE HEATMAP"} field={"attrs.type"} width={store.getState().width - 300} units={"count"} />
                    </div>
                }
                <div className="row no-gutters"> {this.state.charts["BLACKLIST STATISTICS"] &&
                    <div className="col-5" style={{"marginRight": "4px"}}>
                        <MultivalueChart data={
                            this.state.blacklistStats
                        }
                            field="attrs.hostname"
                            id="blacklistStats"
                            title={
                                "BLACKLIST STATISTICS"
                            }
                            name1={
                                "hostname"
                            }
                            name2={
                                "MAX"
                            }
                            name3={
                                "MIN"
                            }
                        />
                    </div>
                }
                    {this.state.charts["SEVERITY"] && <div className="col-auto" >
                        <ListChart data={this.state.severity}
                            name={"SEVERITY"}
                            field={"severity"}
                        />  </div>
                    }
                </div>
                <div className="row no-gutters">
                    {this.state.charts["PARALLEL CALLS"] &&
                        <div className="col-10 pr-1 mr-0">
                            <MultipleAreaChart data={
                                this.state.parallelCalls
                            } name={"PARALLEL CALLS"} id={"parallelCalls"} units={"count"} />
                        </div>
                    }
                    {this.state.charts["ACTUAL CALLS"] &&
                        <div className="col-2 px-1">
                            <CountUpChart data={this.getLastValueInInterval(this.state.parallelCalls, 1)} name={"ACTUAL CALLS"} biggerFont={"biggerFont"} dataAgo={this.getLastValueInInterval(this.state.parallelCalls, 0)} />
                        </div>
                    }
                </div>
                <div className="row no-gutters">
                    {this.state.charts["PARALLEL REGS"] &&
                        <div className="col-10 pr-1 mr-0">
                            <MultipleAreaChart data={
                                this.state.parallelRegs
                            } name={"PARALLEL REGS"} id={"parallelRegs"} units={"count"} />
                        </div>
                    }
                    {this.state.charts["ACTUAL REGS"] &&
                        <div className="col-2 px-1">
                            <CountUpChart data={this.getLastValueInInterval(this.state.parallelRegs, 1)} name={"ACTUAL REGS"} biggerFont={"biggerFont"} dataAgo={this.getLastValueInInterval(this.state.parallelRegs, 0)} />
                        </div>
                    }
                </div>
                <div className="row no-gutters">
                    {this.state.charts["INCIDENTS"] && <div className="col-10 pr-1 mr-0">
                        <MultipleAreaChart data={
                            this.state.incidentCount
                        } name={"INCIDENTS"} units={"count"} id={"incidentCount"} />
                    </div>}
                    {this.state.charts["INCIDENTS ACTUAL"] &&
                        <div className="col-2 px-1">
                            <CountUpChart data={this.getLastValueInInterval(this.state.incidentCount, 1)} name={"INCIDENTS ACTUAL"} biggerFont={"biggerFont"} dataAgo={this.getLastValueInInterval(this.state.incidentCount, 0)} />
                        </div>}
                </div>
            </div>
        );
    }
}

export default HomeCharts;
