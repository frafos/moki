/*
Class to get data for all charts iin Call dashboard
*/

import React from 'react';
import Dashboard from '../Dashboard.js';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import MultipleLineChart from '../../charts/multipleLine_chart';
import { parseMultipleLineData } from '../../../es-response-parser';


class NetworkCharts extends Dashboard {
    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "network/charts",
            callsByHost: [],
            regsByHost: [],
            callStartsByHost: [],
            relayedRtpByHost: [],
            rxBytesByHost: [],
            txBytesByHost: [],
            rxPacketByHost: [],
            txPacketByHost: [],
            rxBytesByInterface: [],
            txBytesByInterface: [],
            rxPacketByInterface: [],
            txPacketByInterface: [],
            blacklist: [],
            greylist: [],
            whitelist: [],
            isLoading: true,
            hostnames: [],
            dropAlert: [],
            charts: []

        };
        this.callBacks = {
            functors: [
                //CALLS BY HOST
                [{ result: 'callsByHost', func: parseMultipleLineData }],

                //REGS BY HOST
                [{ result: 'regsByHost', func: parseMultipleLineData }],

                //CALL STARTS BY HOST
                [{ result: 'callStartsByHost', func: parseMultipleLineData }],

                //RELAYED RTP BY HOST
                [{ result: 'relayedRtpByHost', func: parseMultipleLineData }],

                //RX BYTES BY HOST
                [{ result: 'rxBytesByHost', func: parseMultipleLineData }],

                //TX BYTES BY HOST
                [{ result: 'txBytesByHost', func: parseMultipleLineData }],

                //RX PACKET BY HOST
                [{ result: 'rxPacketByHost', func: parseMultipleLineData }],

                //TX PACKET BY HOST
                [{ result: 'txPacketByHost', func: parseMultipleLineData }],

                //RX BYTES BY INTERFACE
                [{ result: 'rxBytesByInterface', func: parseMultipleLineData }],

                //TX BYTES BY INTERFACE
                [{ result: 'txBytesByInterface', func: parseMultipleLineData }],

                //RX PACKETS BY INTERFACE
                [{ result: 'rxPacketByInterface', func: parseMultipleLineData }],

                //TX PACKETS BY INTERFACE
                [{ result: 'txPacketByInterface', func: parseMultipleLineData }],

                //IPS ON FW BLACKLIST BY HOST
                [{ result: 'blacklist', func: parseMultipleLineData }],

                //IPS ON FW GREYLIST BY HOST
                [{ result: 'greylist', func: parseMultipleLineData }],

                //IPS ON FW WHITELIST BY HOST
                [{ result: 'whitelist', func: parseMultipleLineData }]
            ]
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.hostnames !== prevState.hostnames) {
            return { hostnames: nextProps.hostnames };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.hostnames !== this.props.hostnames) {
            this.setState({ hostnames: this.props.hostnames });
        }
    }

    componentWillUnmount() {
        // fix Warning: Can't perform a React state update on an unmounted component
        this.setState = (state, callback) => {
            return;
        };
    }


    //render GUI
    render() {
        return (
            <div>
                {this.state.isLoading && <LoadingScreenCharts />}
                <div className="row no-gutters">
                    {this.state.charts["MAX CALLS BY HOST"] && <div className="col-6 pr-1">
                        <MultipleLineChart id="callsByHost" hostnames={this.state.hostnames} data={this.state.callsByHost} name={"MAX CALLS BY HOST"} ticks={3}
                        />
                    </div>
                    }
                    {this.state.charts["MAX REGS BY HOST"] && <div className="col-6 px-1">
                        <MultipleLineChart id="regsByHost" hostnames={this.state.hostnames} data={this.state.regsByHost} name={"MAX REGS BY HOST"} ticks={3}
                        />
                    </div>
                    }
                    {this.state.charts["MAX CALL STARTS BY HOST"] &&
                        <div className="col-6 pr-1">
                            <MultipleLineChart id="callStartsByHost" hostnames={this.state.hostnames} data={this.state.callStartsByHost} name={"MAX CALL STARTS BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["RELAYED RTP BY HOST"] &&
                        <div className="col-6 px-1">
                            <MultipleLineChart id="relayedRtpByHost" hostnames={this.state.hostnames} data={this.state.relayedRtpByHost} name={"RELAYED RTP BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["TX BYTES BY HOST"] &&
                        <div className="col-6 pr-1">
                            <MultipleLineChart id="txBytesByHost" hostnames={this.state.hostnames} data={this.state.txBytesByHost} name={"TX BYTES BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["RX PACKET BY HOST"] &&
                        <div className="col-6 px-1">
                            <MultipleLineChart id="rxPacketByHost" hostnames={this.state.hostnames} data={this.state.rxPacketByHost} name={"RX PACKET BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["TX PACKET BY HOST"] &&
                        <div className="col-6 pr-1">
                            <MultipleLineChart id="txPacketByHost" hostnames={this.state.hostnames} data={this.state.txPacketByHost} name={"TX PACKET BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["RX BYTES BY INTERFACE"] &&
                        <div className="col-6 px-1">
                            <MultipleLineChart id="rxBytesByInterface" field="type_instance" hostnames={this.state.hostnames} data={this.state.rxBytesByInterface} name={"RX BYTES BY INTERFACE"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["TX BYTES BY INTERFACE"] &&

                        <div className="col-6 pr-1">
                            <MultipleLineChart id="txBytesByInterface" field="type_instance" hostnames={this.state.hostnames} data={this.state.txBytesByInterface} name={"TX BYTES BY INTERFACE"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["RX PACKETS BY INTERFACE"] &&

                        <div className="col-6 px-1">
                            <MultipleLineChart id="rxPacketByInterface" field="type_instance" hostnames={this.state.hostnames} data={this.state.rxPacketByInterface} name={"RX PACKETS BY INTERFACE"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["TX PACKETS BY INTERFACE"] &&
                        <div className="col-6 pr-1">
                            <MultipleLineChart id="txPacketByInterface" field="type_instance" hostnames={this.state.hostnames} data={this.state.txPacketByInterface} name={"TX PACKETS BY INTERFACE"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["IPS ON FW BLACKLIST BY HOST"] &&
                        <div className="col-6 px-1">
                            <MultipleLineChart id="blacklist" hostnames={this.state.hostnames} data={this.state.blacklist} name={"IPS ON FW BLACKLIST BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["IPS ON FW GREYLIST BY HOST"] &&
                        <div className="col-6 pr-1">
                            <MultipleLineChart id="greylist" hostnames={this.state.hostnames} data={this.state.greylist} name={"IPS ON FW GREYLIST BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["IPS ON FW WHITELIST BY HOST"] &&
                        <div className="col-6 px-1">
                            <MultipleLineChart id="whitelist" hostnames={this.state.hostnames} data={this.state.whitelist} name={"IPS ON FW WHITELIST BY HOST"} ticks={3}
                            />
                        </div>
                    }
                    {this.state.charts["PACKET DROP ALERT COUNTERS"] &&
                        <div className="col-6 px-1">
                            <MultipleLineChart id="dropAlert" hostnames={this.state.hostnames} data={this.state.dropAlert} name={"PACKET DROP ALERT COUNTERS"} ticks={3}
                            />
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default NetworkCharts;
