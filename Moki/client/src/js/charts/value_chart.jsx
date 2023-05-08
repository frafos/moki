import { Component } from 'react';

export default class ValueChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            color: "grey",
            data: this.props.data
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props.data !== nextProps.data) {
            this.setState({
                data: nextProps.data
            });
            if (this.props.color === "zerogreen") {
                if (nextProps.data === 0 || nextProps.data.length === 0) {
                    this.setState({ color: "green" })
                }
                else {
                    this.setState({ color: "red" })
                }
            }
        }
    }

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

        return (
            <div id={this.props.name}  className="chart valueChart" style={{"float": "inherit"}}>
                <h3 className="alignLeft title" style={{"float": "inherit"}}>{this.props.name}</h3>
                <h4 className={"alignLeft " + this.props.biggerFont} style={{ "color": this.state.color }}>{niceNumber(this.state.data, this.props.name)}</h4>
            </div>
        )
    }
}