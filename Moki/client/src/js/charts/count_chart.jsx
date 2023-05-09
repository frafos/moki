import { Component } from 'react';
import Animation from '../helpers/Animation';
import {
    getTimeBucket
} from "../helpers/getTimeBucket";
import store from "@/js/store"

export default class CountUpChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            data: [],
            dataAgo: 0
        }
        this.countUp = this.countUp.bind(this);
        this.setData = this.setData.bind(this);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            this.setState(nextProps);
            this.countUp(nextProps.data);
            this.getDifference(nextProps.data, nextProps.dataAgo);
        }
    }

    setData(data) {
        if (data) {
            this.setState({
                data: data,
                count: data
            });
        }
    }

    getNumberLength(number) {
        return number.toString().length;
    }

    countUp(data) {
        if (data > 0) {
            var end = data;
            var current = 0;
            //too long duration - got stuck
            // var duration = 120;
            //var increment = end <= duration ? Math.abs(Math.floor(duration / end)) : Math.abs(Math.floor(end / duration));
            var increment = Math.abs(Math.floor(data / 10)) === 0 ? 1 : Math.abs(Math.floor(data / 10));
            var thiss = this;

            var timer = setInterval(function () {
                current += increment;
                thiss.setState({ count: current });

                if (current + increment >= end) {
                    thiss.setState({ count: end });
                    clearInterval(timer);
                }
            }, 1);
        }
        else {
            this.setState({
                count: 0,
                data: 0
            });
        }
    }

    getDifference(value, valueAgo) {
        let diff = value - valueAgo;
        diff = Math.ceil(diff);
        this.setState({ valueAgo: diff })
    }

    //display="none"
    render() {
        function niceNumber(nmb, name) {
            if (name.includes("DURATION")) {
                var sec_num = parseInt(nmb, 10);
                var days = Math.floor(sec_num / 86400) ? Math.floor(sec_num / 86400) + "d" : "";
                sec_num = sec_num - (Math.floor(sec_num / 86400) * 86400);

                var hours = Math.floor(sec_num / 3600) ? Math.floor(sec_num / 3600) + "h" : "";
                sec_num = sec_num - (Math.floor(sec_num / 3600) * 3600);

                var minutes = Math.floor((sec_num % 3600) / 60) ? Math.floor((sec_num % 3600) / 60) + "m" : "";
                sec_num = sec_num - (Math.floor((sec_num % 3600) / 60) * 60);

                var seconds = sec_num % 60 ? sec_num % 60 + "s" : "";

                //don't  display seconds if value is in days
                if (days) {
                    seconds = "";
                }

                if (!days && !hours && !minutes && !seconds) return "0s";
                return days + " " + hours + " " + minutes + " " + seconds;
            }
            else if (nmb) {
                return nmb.toLocaleString();
            } else {
                return 0;
            }
        }

        var digits = this.getNumberLength(this.state.count);
        var style ="";

        if(digits > 8){
            style ="count-chart-counter-xs";
        }
        else if(digits > 5){
            style ="count-chart-counter-sm";
        }
        const timerange = store.getState().filter.timerange;
        const bucket = getTimeBucket(timerange);
        return (
            <div style={{"minWidth": "180px"}} id={this.props.name} className={ (window.location.pathname === "/home" || window.location.pathname === "/") ? "chart valuechartHeight" : "chart valuechart" } >
                {window.location.pathname === "/web" && <Animation name={this.props.name} type={this.props.type} setData={this.setData} dataAll={this.state.data} autoplay={this.props.autoplay} display={this.props.displayAnimation} />}
                <h3 className="alignLeft title" style={{ "float": "inherit" }}>{this.props.name}</h3>
                <h4 className={"alignLeft count-chart-counter " + style} title={"last " + bucket} >{niceNumber(this.state.data, this.props.name)}</h4>
                {!Number.isNaN(this.state.valueAgo) && <h4 className={"alignLeft "} title={"difference to previous"}><span style={{ "color": this.state.valueAgo === 0 ? "black" : this.state.valueAgo > 0 ? "green" : "red" }}>{this.state.valueAgo > 0 ? "(+" + this.state.valueAgo + ")" : "(" + this.state.valueAgo + ")"}</span></h4>}
            </div>
        )
    }
}
