import React, {
    Component
} from 'react';
import { ColorType, getExceededColor } from '../../gui';

class Type extends Component {
    constructor(props) {
        super(props);
        let color = ColorType[this.props.id];
        if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
            color = getExceededColor(this.props.name);
        }
        this.state = {
            state: this.props.state ? this.props.state : 'enable',
            color: this.props.state && this.props.state === "disable" ? "transparent" : color,
            timer: null
        }
        this.disableType = this.disableType.bind(this);

    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // if (nextProps.state !== this.props.state) {
        let color = ColorType[this.props.id];
        if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
            color = getExceededColor(this.props.id);
        }
        if (nextProps.state === "disable") {
            this.setState({ state: 'disable' });
            this.setState({ color: 'transparent' });

        } else {
            this.setState({ state: 'enable' });
            this.setState({ color: color });
            //        }
        }
    }

    //single click - deselect this type
    //doubůe click - select only this type
    disableType(events) {
        let id = events.currentTarget.getAttribute('id');
        //sigle click
        if (events.detail === 1) {
            let timer = setTimeout(() => {
                if (this.state.state === "enable") {
                    this.props.disableType(id, "disable", "transparent", "single");
                }
                else {
                    this.props.disableType(id, "enable", ColorType[this.props.id], "single");
                }
            }, 200);

            this.setState({
                timer: timer
            })
            //double click
        } else if (events.detail === 2) {
            clearTimeout(this.state.timer);
            this.setState({
                timer: null,
                state: 'disable',
                color: 'transparent'
            });
            this.props.disableType(id, "disable", "transparent", "double");

        }
    }

    render() {
        return (
            <button type="button" className={this.props.state === "enable" ? "type" : "type stripes"} id={this.props.id} state={this.state.state} title={this.props.description ? this.props.description : ""} style={{ backgroundColor: this.state.color }} onClick={this.disableType}>{this.props.name}
            </button>
        )
    };
}

export default Type;