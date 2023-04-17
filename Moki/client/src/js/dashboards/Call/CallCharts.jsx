/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';
import Dashboard from '../Dashboard.js';
import SunburstChart from '../../charts/sunburst_chart.jsx';
import DonutChart from '../../charts/donut_chart.jsx';
import DatebarChart from '../../charts/datebar_chart.jsx';
import ListChart from '../../charts/list_chart.jsx';
import ValueChart from '../../charts/value_chart.jsx';
import StackedChartLine from '../../charts/timedate_stackedbar_with_line_chart.jsx'; 
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import { parseListData, parseStackedbarTimeData, parseBucketData, parseSunburstData, 
    parseQueryStringData, parseAggData, parseAggSumBucketData } from '../../../es-response-parser';


class CallCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "calls/charts",
            eventCallsTimeline: [],
            callTerminated: [],
            callSuccessRatio: [],
            sumCallAttempt: [],
            sumCallEnd: [],
            sumCallStart: [],
            durationSum: [],
            avgMoS: [],
            answerSeizureRatio: [],
            durationGroup: [],
            sipcodeCount: [],
            calledCountries: [],
            sumDurationOverTime: [],
            callingCountries: [],
            avgDuration: [],
            maxDuration: [],
            charts: [],
            isLoading: false,
            asrDurationOverTime: []
        };
        this.callBacks = {
            functors: [
                //CALL TERMINATED 0
                [{ result: 'callTerminated', func: parseBucketData, attrs: ["attrs.originator"] }],
                //CALL SUCCESS RATIO 1
                [{ result: 'callSuccessRatio', func: parseSunburstData, attrs: ["attrs.sip-code"] }],
                //SUM CALL-ATTEMPT 2
                [{ result: 'sumCallAttempt', func: parseQueryStringData, attrs: ["attrs.type"] }],
                //SUM CALL-END 3
                [{ result: 'sumCallEnd', func: parseQueryStringData, attrs: ["attrs.type"] }],
                //SUM CALL-START 4
                [{ result: 'sumCallStart', func: parseQueryStringData, attrs: ["attrs.type"] }],
                //DURATION SUM 5
                [{ result: 'durationSum', func: parseAggData, attrs: ["attrs.duration"] }],
                //NOT USED 6
                [],
                //AVG MoS 7
                [{ result: 'avgMoS', func: parseAggData, attrs: ["attrs.rtp-MOScqex-avg"] }],
                //ANSWER-SEIZURE RATIO 8
                [{ result: 'answerSeizureRatio', func: parseAggSumBucketData }],
                //CALLING COUNTRIES 9
                [{ result: 'callingCountries', func: parseListData, attrs: ["geoip.src.iso_code"] }],
                //SUM DURATION OVER TIME 10
                [{ result: 'sumDurationOverTime', func: parseBucketData, attrs: ["attrs.duration"] }],
                //MAX DURATION 11
                [{ result: 'maxDuration', func: parseAggData, attrs: ["attrs.duration"] }],
                //NOT USED 12
                [],
                //AVG DURATION 13
                [{ result: 'avgDuration', func: parseAggData, attrs: ["attrs.duration"] }],
                //DURATION GROUP 14
                [{ result: 'durationGroup', func: parseListData, attrs: ["attrs.durationGroup"] }],
                //SIP-CODE COUNT 15
                [{ result: 'sipcodeCount', func: parseListData, attrs: ["attrs.sip-code"] }],
                //CALLED COUNTRIES 16
                [{ result: 'calledCountries', func: parseListData, attrs: ["attrs.tst_cc"] }],
                //EVENT CALLS TIMELINE 17
                [{ result: 'eventCallsTimeline', func: parseStackedbarTimeData, attrs: ["attrs.type"] }],
                //ASR OVER TIME 18
                [{ result: 'asrDurationOverTime', func: parseBucketData, attrs: ["attrs.duration"] }]
            ]
        };
    }


    //render GUI
    render() {

        return (
            <div>
                {this.state.isLoading && <LoadingScreenCharts />}

                <div className="row no-gutters">
                    {this.state.charts["ATTEMPTs"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.sumCallAttempt
                        } name={"ATTEMPTs"} />
                    </div>
                    }
                    {this.state.charts["ENDs"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.sumCallEnd
                        } name={"ENDs"} />
                    </div>}
                    {this.state.charts["STARTs"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.sumCallStart
                        } name={"STARTs"} />
                    </div>}
                    {this.state.charts["ASR (%)"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.answerSeizureRatio
                        } name={"ASR (%)"} />
                    </div>}
                    {this.state.charts["MAX DURATION"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.maxDuration
                        } name={"MAX DURATION"} />
                    </div>}
                    {this.state.charts["AVG DURATION"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.avgDuration
                        } name={"AVG DURATION"} />
                    </div>}
                    {this.state.charts["SUM DURATION"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.durationSum
                        } name={"SUM DURATION"} />
                    </div>}
                    {this.state.charts["AVG MoS"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.avgMoS
                        } name={"AVG MoS"} />
                    </div>}

                </div>
                {this.state.charts["EVENTS OVER TIME"] && <div className="row no-gutters" >
                    <StackedChartLine id="eventsOverTime" data={
                        this.state.eventCallsTimeline
                    } name={"EVENTS OVER TIME"} keys={"calls"} width={store.getState().width - 300} data2={this.state.asrDurationOverTime}  units={"count"}
                    />
                </div>}
                {this.state.charts["SUM DURATION OVER TIME"] && <div className="row no-gutters" >
                    <DatebarChart data={
                        this.state.sumDurationOverTime} id={"sumDurationOverTime"} marginLeft={25} height={200}
                        name={"SUM DURATION OVER TIME"} width={store.getState().width - 300} />
                </div>}
                <div className="row no-gutters" >
                    {this.state.charts["CALL SUCCESS RATIO"] && <div className="col-auto" style={{ "marginRight": "5px" }}>
                        <SunburstChart data={
                            this.state.callSuccessRatio
                        } name={"CALL SUCCESS RATIO"} width={((store.getState().width - 300) / 2)} ends={this.state.sumCallEnd} units={"count"} />
                    </div>}
                    {this.state.charts["SIP-CODE COUNT"] && <div className="col-auto">
                        <ListChart data={
                            this.state.sipcodeCount
                        } name={"SIP-CODE COUNT"} field={"attrs.sip-code"} />
                    </div>}
                    {this.state.charts["CALL TERMINATED"] && <div className="col-auto" style={{ "marginRight": "5px" }}>
                        <DonutChart data={
                            this.state.callTerminated
                        } name={"CALL TERMINATED"} id="callTerminated" width={(store.getState().width - 300) / 2} height={170} field={"attrs.originator"} legendSize={120} units={"count"} />
                    </div>}
                    {this.state.charts["CALLING COUNTRIES"] && <div className="col-auto">
                        <ListChart data={
                            this.state.callingCountries
                        } name={"CALLING COUNTRIES"} field={"geoip.country_code2"} />
                    </div>}
                    {this.state.charts["CALLED COUNTRIES"] && <div className="col-auto">
                        <ListChart data={
                            this.state.calledCountries
                        } name={"CALLED COUNTRIES"} field={"attrs.dst_cc"} />
                    </div>}
                    {this.state.charts["DURATION GROUP"] && <div className="col-auto">
                        <ListChart data={
                            this.state.durationGroup
                        } name={"DURATION GROUP"} field={"attrs.durationGroup"} />
                    </div>}
                </div>
            </div>
        );
    }
}

export default CallCharts;
