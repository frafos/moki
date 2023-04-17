/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import ListChart from '../../charts/list_chart.jsx';
import DonutChart from '../../charts/donut_chart.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import ValueChart from '../../charts/value_chart.jsx';
import { parseListData, parseBucketData, 
    parseAggDistinct, parseListDataCardinality } from '../../../es-response-parser';


class MicroanalysisCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "microanalysis/charts",
            typesCount: [],
            fromUA: [],
            sipMethod: [],
            sipCode: [],
            topSubnets: [],
            prefixStripped: [],
            sourceIP: [],
            top10from: [],
            callerDomain: [],
            top10to: [],
            distinctDestinations: [],
            topCallAttempts: [],
            topCallEnds: [],
            destination: [],
            sumDuration: [],
            topDuration: [],
            topDuration5: [],
            topSBC: [],
            srcCA: [],
            dstCA: [],
            originator: [],
            charts: [],
            distinctIP: [],
            distinctURI: [],
            topNodes: [],
            versions: [],
            callingCountries: [],
            serverIP: [],
            durationGroup: [],
            signature: [],
            isLoading: true
        }
        this.callBacks = {
            functors: [
                //parse data
                //TYPES 0
                [{ result: 'typesCount', func: parseBucketData, attrs: ["attrs.type"] }],

                //FROM UA 1
                [{ result: 'fromUA', func: parseListData, attrs: ["attrs.from-ua"] }],

                //SIP METHOD 2
                [{ result: 'sipMethod', func: parseListData, attrs: ["attrs.method"] }],

                //SIP CODE 3
                [{ result: 'sipCode', func: parseListData, attrs: ["attrs.sip-code"] }],

                //TOP SUBNETS 4
                [{ result: 'topSubnets', func: parseListData, attrs: ["attrs.sourceSubnets"] }],

                //r-URI PREFIX STRIPPED 5
                [{ result: 'prefixStripped', func: parseListData, attrs: ["attrs.r-uri-shorted"] }],

                //SOURCE IP ADDRESS 6
                [{ result: 'sourceIP', func: parseListData, attrs: ["attrs.source"] }],

                //TOP 10 FROM 7
                [{ result: 'top10from', func: parseListData, attrs: ["attrs.from"] }],

                //CALLER DOMAIN 8
                //[{ result: 'callerDomain', func: parseListData }],
                [{ result: 'callerDomain', func: parseListData, attrs: ["attrs.from-domain"] }],

                //TOP 10 TO 9
                [{ result: 'top10to', func: parseListData, attrs: ["attrs.to"] }],

                //DOMAIN STATS 10
                [{ result: 'distinctDestinations', func: parseListDataCardinality, attrs: ["attrs.from-domain"] }],

                //TOP CALL ATTEMPTS 11
                [{ result: 'topCallAttempts', func: parseListData, attrs: ["attrs.from"] }],

                //TOP CALL ENDS 12
                [{ result: 'topCallEnds', func: parseListData, attrs: ["attrs.from"] }],

                //DESTINATION BY R-URI 13
                [{ result: 'destination', func: parseListData, attrs: ["attrs.r-uri"] }],

                //SUM DURATION 14
                [{ result: 'sumDuration', func: parseListDataCardinality, attrs: ["attrs.from", "attrs.duration"] }],

                //TOP DURATION 15
                [{ result: 'topDuration', func: parseListDataCardinality, attrs: ["attrs.from", "attrs.duration"] }],

                //TOP DURATION < 5 sec 16
                [{ result: 'topDuration5', func: parseListData, attrs: ["attrs.from", "attrs.duration"] }],

                //TOP SBCs 17
                [{ result: 'topSBC', func: parseListData, attrs: ["attrs.sbc"] }],

                //SRC CA 18
                [{ result: 'srcCA', func: parseListData, attrs: ["attrs.src_ca_id"] }],

                //DST CA 19
                [{ result: 'dstCA', func: parseListData, attrs: ["attrs.drc_ca_id"] }],

                //ORIGINATOR 20
                [{ result: 'originator', func: parseListData, attrs: ["attrs.originator"] }],

                //DISTINCT IP
                [{ result: 'distinctIP', func: parseAggDistinct, attrs: ["attrs.source"] }],

                //TOP NODES
                [{ result: 'topNodes', func: parseListData, attrs: ["agent.hostname"] }],

                //SIP VERSIONS 
                [{ result: 'versions', func: parseBucketData, attrs: ["agent.version"] }],

                //DISTINCT URI
                [{ result: 'distinctURI', func: parseAggDistinct, attrs: ["attrs.from.keyword"] }],

                //CALLING COUNTRIES 25
                [{ result: 'callingCountries', func: parseListData, attrs: ["geoip.country_code2"] }],

                //SERVER IP 
                [{ result: 'serverIP', func: parseListData, attrs: ["server.ip"] }],
                //DURATION GROUP 27
                [{ result: 'durationGroup', func: parseListData, attrs: ["attrs.durationGroup"] }],
                //EVENTS BY SIGNATURE 28
                [{ result: 'signature', func: parseListData, attrs: ["sip.request.sig"] }],
            ]
        }
    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        }

            <div className="row no-gutters" >
                <div className="col-auto">
                    {this.state.charts["DISTINCT IP"] && <ValueChart
                        data={this.state.distinctIP}
                        name={"DISTINCT IP"} />}
                    {this.state.charts["DISTINCT URI"] && <ValueChart
                        data={this.state.distinctURI}
                        name={"DISTINCT URI"} />}
                </div>
                {this.state.charts["TYPES"] && <div className="col-auto" style={{ "marginRight": "5px" }} >
                    <DonutChart
                        data={this.state.typesCount}
                        units={"count"}
                        name={"TYPES"}
                        id="types"
                        width={500}
                        legendSize={50}
                        height={200}
                        field="attrs.type" />
                </div>}
                {this.state.charts["FROM UA"] && <div className="col-auto" >
                    <ListChart data={this.state.fromUA}
                        name={"FROM UA"}
                        field={"attrs.from-ua"}
                    />   </div>}
            </div>
            <div className="row no-gutters" >
                {this.state.charts["SIP METHOD"] && <div className="col-auto" >
                    <ListChart data={this.state.sipMethod}
                        name={"SIP METHOD"}
                        field={"attrs.method"}
                    />  </div>}
                {this.state.charts["SIP CODE"] && <div className="col-auto">
                    <ListChart data={this.state.sipCode}
                        name={"SIP CODE"}
                        field={"attrs.sip-code"}
                    />  </div >}
                {this.state.charts["TOP SUBNETS /24"] && <div className="col-auto">
                    <ListChart data={this.state.topSubnets}
                        name={"TOP SUBNETS /24"}
                        field={"attrs.sourceSubnets"}
                    />  </div>}
                {this.state.charts["VERSIONS"] && <div className="col-auto" style={{ "marginRight": "5px" }} >
                    <DonutChart
                        data={this.state.versions}
                        units={"count"}
                        name={"SIPCMBEAT VERSIONS"}
                        id="versions"
                        width={500}
                        legendSize={50}
                        height={200}
                        field="agent.version" />
                </div>}
                {this.state.charts["r-URI"] && <div className="col-auto" >
                    <ListChart data={this.state.prefixStripped}
                        name={"r-URI - short"}
                        field={"attrs.r-uri-shorted"}
                    />  </div>}
                {this.state.charts["SOURCE IP ADDRESS"] && <div className="col-auto" >
                    <ListChart data={this.state.sourceIP}
                        name={"SOURCE IP ADDRESS"}
                        field={"attrs.source"}
                    />  </div>}
                {this.state.charts["SRC CA"] && <div className="col-auto" >
                    <ListChart data={this.state.srcCA}
                        name={"SRC CA"}
                        field={"attrs.src_ca_name"}
                    />  </div>}
                {this.state.charts["DST CA"] && <div className="col-auto" >
                    <ListChart data={this.state.dstCA}
                        name={"DST CA"}
                        field={"attrs.dst_ca_name"}
                    />  </div>}
                {this.state.charts["ORIGINATOR"] && <div className="col-auto" >
                    <ListChart data={this.state.originator}
                        name={"ORIGINATOR"}
                        field={"attrs.originator"}
                    />  </div>}
                {this.state.charts["TOP 10 FROM"] && <div className="col-auto" >
                    <ListChart data={this.state.top10from}
                        name={"TOP 10 FROM"}
                        field={"attrs.from.keyword"}
                    />  </div>}
                {this.state.charts["CALLER DOMAIN"] && <div className="col-auto" >
                    <ListChart data={this.state.callerDomain}
                        name={"CALLER DOMAIN"}
                        field={"attrs.from-domain"}
                    />  </div>}
                {this.state.charts["TOP 10 TO"] && <div className="col-auto" >
                    <ListChart data={this.state.top10to}
                        name={"TOP 10 TO"}
                        field={"attrs.to.keyword"}
                    />  </div>}
                {this.state.charts["DISTINCT DESTINATIONS"] && <div className="col-auto" >
                    <ListChart data={this.state.distinctDestinations}
                        name={"DISTINCT DESTINATIONS"}
                        field={"attrs.from.keyword"}
                    />  </div>}

                {this.state.charts["TOP CALL ATTEMPTS"] && <div className="col-auto" >
                    <ListChart data={this.state.topCallAttempts}
                        name={"TOP CALL ATTEMPTS"}
                        field={"attrs.from.keyword"}
                    />  </div>}
                {this.state.charts["TOP CALL ENDS"] && <div className="col-auto">
                    <ListChart data={this.state.topCallEnds}
                        name={"TOP CALL ENDS"}
                        field={"attrs.from.keyword"}
                    />  </div>}
                {this.state.charts["DESTINATION BY R-URI"] && <div className="col-auto" >
                    <ListChart data={this.state.destination}
                        name={"DESTINATION BY R-URI"}
                        field={"attrs.r-uri.keyword"}
                    />  </div>}
                {this.state.charts["EVENTS BY SIGNATURE"] && <div className="col-auto" >
                    <ListChart data={
                        this.state.signature
                    }
                        name={
                            "EVENTS BY SIGNATURE"
                        }
                        type="list"
                        field={
                            "sip.request.sig"
                        }
                    />  </div>}

                {this.state.charts["SUM DURATION"] && <div className="col-auto" >
                    <ListChart data={this.state.sumDuration}
                        name={"SUM DURATION"}
                        field={"attrs.from.keyword"}
                    />  </div>}
                {this.state.charts["DURATION GROUP"] && <div className="col-auto">
                    <ListChart data={
                        this.state.durationGroup
                    } name={"DURATION GROUP"} field={"attrs.durationGroup"} />
                </div>}
                {this.state.charts["TOP DURATION"] && <div className="col-auto" >
                    <ListChart data={this.state.topDuration}
                        name={"TOP DURATION"}
                        field={"attrs.from.keyword"}
                    />  </div >}
                {this.state.charts["TOP DURATION < 5 sec"] && <div className="col-auto" >
                    <ListChart data={this.state.topDuration5}
                        name={"TOP DURATION < 5 sec"}
                        field={"attrs.from.keyword"}
                    />  </div >}
                {this.state.charts["TOP SBCs LIST"] && <div className="col-auto" >
                    <ListChart data={this.state.topSBC}
                        name={"TOP SBCs LIST"}
                        field={"attrs.sbc"}
                    />  </div>}
                {this.state.charts["TOP NODEs LIST"] && <div className="col-auto" >
                    <ListChart data={this.state.topNodes}
                        name={"TOP HOSTs LIST"}
                        field={"agent.hostname"}
                    />  </div>}
                {this.state.charts["CALLING COUNTRIES"] && <div className="col-auto" >
                    <ListChart data={this.state.callingCountries}
                        name={"CALLING COUNTRIES"}
                        field={"geoip.country_code2"}
                    />  </div>}
                {this.state.charts["SERVER IP"] && <div className="col-auto" >
                    <ListChart data={this.state.serverIP}
                        name={"SERVER IP"}
                        field={"server.ip"}
                    />  </div>}
            </div> </div>
        );
    }
}

export default MicroanalysisCharts;
