import React, {
    Component
} from 'react';
import { ColorType, getExceededColor } from '@moki-client/gui';

class Type extends Component {
    constructor(props) {
        super(props);
        let color = ColorType[this.props.id];
        if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
            color = getExceededColor(this.props.id);
        }
        this.state = {
            state: this.props.state ? this.props.state : 'enable',
            color: this.props.state && this.props.state === "disable" ? "gray" : color,
        }
        this.disableType = this.disableType.bind(this);

    }

    componentWillReceiveProps(nextProps) {
        // if (nextProps.state !== this.props.state) {
        let color = ColorType[this.props.id];
        if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
            color = getExceededColor(this.props.id);
        }
        if (nextProps.state === "disable") {
            this.setState({ state: 'disable' });
            this.setState({ color: 'gray' });

        } else {
            this.setState({ state: 'enable' });
            this.setState({ color: color });
            //        }
        }
    }

    //if all is selected, disable everything accept this type
    disableType(events) {
        if (this.props.isAllSelected) {
            this.props.disableType(events.currentTarget.getAttribute('id'), "disable", "grey");
        }
        else {

            if (this.state.state === "enable") {
                this.setState({ state: 'disable' });
                this.setState({ color: 'gray' });
                this.props.disableType(events.currentTarget.getAttribute('id'), "disable", "grey");

            } else {
                this.setState({ state: 'enable' });
                this.setState({ color: ColorType[this.props.id] });
                this.props.disableType(events.currentTarget.getAttribute('id'), "enable", ColorType[this.props.id]);
            }
        }
    }

    render() {
        return (
            <button type="button" className="type" id={this.props.id} state={this.state.state} title={this.props.description ? this.props.description : ""} style={{ backgroundColor: this.state.color }} onClick={this.disableType}>{this.props.name}
            </button>
        )
    };
}

export default Type;