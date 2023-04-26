/*
Class to get data for all charts iin Call dashboard
*/

import React from 'react';
import Dashboard from '../Dashboard.js';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import MultipleLineChart from '@charts/multipleLine_chart';
import { parseMultipleLineData } from '../../../es-response-parser';


class RealmCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "realm/charts",
            maxCallsFromByHost: [],
            maxCallsToByHost: [],
            maxCallsFromByrealm: [],
            maxCallsToByrealm: [],
            maxStartCallsFromByHost: [],
            maxStartCallsToByHost: [],
            maxStartCallsFromByrealm: [],
            maxStartCallsToByrealm: [],
            rtpToByHost: [],
            rtpFromByHost: [],
            rtpToByRealm: [],
            rtpFromByRealm: [],
            isLoading: true,
            hostnames: []

        };
        this.callBacks = {
            functors: [
                //MAX CALLS FROM BY HOST
                [{ result: 'maxCallsFromByHost', func: parseMultipleLineData }],

                //MAX CALLS To BY HOST
                [{ result: 'maxCallsToByHost', func: parseMultipleLineData }],

                ////MAX CALLS FROM BY REALM
                [{ result: 'maxCallsFromByrealm', func: parseMultipleLineData }],

                //MAX CALLS TO BY REALM
                [{ result: 'maxCallsToByrealm', func: parseMultipleLineData }],

                //MAX START CALLS FROM BY HOST
                [{ result: 'maxStartCallsFromByHost', func: parseMultipleLineData }],

                //MAX START CALLS To BY HOST
                [{ result: 'maxStartCallsToByHost', func: parseMultipleLineData }],

                //MAX START CALLS FROM BY REALM
                [{ result: 'maxStartCallsFromByrealm', func: parseMultipleLineData }],

                //MAX START CALLS TO BY REALM
                [{ result: 'maxStartCallsToByrealm', func: parseMultipleLineData }],

                //RTP RELAYED TO BY HOST
                [{ result: 'rtpToByHost', func: parseMultipleLineData }],

                //RTP RELAYED FROM BY HOST
                [{ result: 'rtpFromByHost', func: parseMultipleLineData }],

                //RTP RELAYED TO BY REALM
                [{ result: 'rtpToByRealm', func: parseMultipleLineData }],

                //RTP RELAYED FROM BY REALM
                [{ result: 'rtpFromByRealm', func: parseMultipleLineData }]
            ]
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.hostnames !== prevState.hostnames) {
            return { hostnames: nextProps.hostnames };
        }
        else return null;
    }

    componentDidUpdate(prevProps) {
        if (prevProps.hostnames !== this.props.hostnames) {
            this.setState({ hostnames: this.props.hostnames });
        }
    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        } <div className="row no-gutters" >
                <div className="col-6 pr-1" >
                    <MultipleLineChart id="maxCallsFromByHost"
                        hostnames={this.state.hostnames}
                        data={
                            this.state.maxCallsFromByHost
                        }
                        name={
                            "MAX CALLS FROM BY HOST"
                        }
                        ticks={
                            3
                        }
                    />                            </div>
                <div className="col-6 px-1" >
                    <MultipleLineChart id="maxCallsToByHost"
                        data={
                            this.state.maxCallsToByHost
                        }
                        name={
                            "MAX CALLS TO BY HOST"
                        }
                        hostnames={this.state.hostnames}
                        ticks={
                            3
                        }
                    />                            </div>
                <div className="col-6 pr-1" >
                    <MultipleLineChart id="maxCallsFromByrealm"
                        data={
                            this.state.maxCallsFromByrealm
                        }
                        hostnames={this.state.realm}
                        name={
                            "MAX CALLS FROM BY REALM"
                        }
                        field={"attrs.realm"}
                        ticks={
                            3
                        }
                    />                            </div>
                <div className="col-6 px-1" >
                    <MultipleLineChart id="maxCallsToByrealm"
                        data={
                            this.state.maxCallsToByrealm
                        }
                        name={
                            "MAX CALLS TO BY REALM"
                        }
                        field={"attrs.realm"}
                        hostnames={this.state.hostnames}
                        ticks={
                            3
                        }
                    />                            </div>

                <div className="col-6 pr-1" >
                    <MultipleLineChart id="maxStartCallsFromByHost"
                        data={
                            this.state.maxStartCallsFromByHost
                        }
                        hostnames={this.state.hostnames}
                        name={
                            "MAX START CALLS FROM BY HOST"
                        }
                        ticks={
                            3
                        }
                    />                            </div>

                <div className="col-6 px-1" >
                    <MultipleLineChart id="maxStartCallsToByHost"
                        data={
                            this.state.maxStartCallsToByHost
                        }
                        hostnames={this.state.hostnames}
                        name={
                            "MAX START CALLS TO BY HOST"
                        }
                        ticks={
                            3
                        }
                    />                            </div>

                <div className="col-6 pr-1" >
                    <MultipleLineChart id="maxStartCallsFromByrealm"
                        data={
                            this.state.maxStartCallsFromByrealm
                        }
                        hostnames={this.state.hostnames}
                        name={
                            "MAX START CALLS FROM BY REALM"
                        }
                        field={"attrs.realm"}
                        ticks={
                            3
                        }
                    />                            </div >

                <div className="col-6 px-1" >
                    <MultipleLineChart id="maxStartCallsToByrealm"
                        data={
                            this.state.maxStartCallsToByrealm
                        }
                        hostnames={this.state.hostnames}
                        name={
                            "MAX START CALLS TO BY REALM"
                        }
                        field={"attrs.realm"}
                        ticks={
                            3
                        }
                    />                            </div >

                <div className="col-6 pr-1" >
                    <MultipleLineChart id="rtpToByHost"
                        data={
                            this.state.rtpToByHost
                        }
                        hostnames={this.state.hostnames}
                        name={
                            "RTP RELAYED TO BY HOST"
                        }
                        ticks={
                            3
                        }
                    />                            </div >

                < div className="col-6 px-1" >
                    <MultipleLineChart id="rtpFromByHost"
                        data={
                            this.state.rtpFromByHost
                        }
                        name={
                            "RTP RELAYED FROM BY HOST"
                        }
                        hostnames={this.state.hostnames}
                        ticks={
                            3
                        }
                    />                            </div >

                <div className="col-6 pr-1" >
                    <MultipleLineChart id="rtpToByRealm"
                        data={
                            this.state.rtpToByRealm
                        }
                        name={
                            "RTP RELAYED TO BY REALM"
                        }
                        field={"attrs.realm"}
                        hostnames={this.state.hostnames}
                        ticks={
                            3
                        }
                    />                            </div>

                <div className="col-6 px-1" >
                    <MultipleLineChart id="rtpFromByRealm"
                        data={
                            this.state.rtpFromByRealm
                        }
                        name={
                            "RTP RELAYED FROM BY REALM"
                        }
                        field={"attrs.realm"}
                        hostnames={this.state.hostnames}
                        ticks={
                            3
                        }
                    />                            </div >


            </div> </div>
        );
    }
}

export default RealmCharts;
