import { Component } from 'react';
import querySrv from './querySrv';

import unlistthemAll from "/icons/whitelist_remove.png";
import listthemAll from "/icons/whitelist.png";
import suppressIcon from "/icons/suppress.png";
import unsuppressIcon from "/icons/view.png";


class AdvancedProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.obj,
            issupress: false,
            islistmall: false
        }
        this.load = this.load.bind(this);
        this.changeState = this.changeState.bind(this);
    }

    componentDidMount() {
        this.load();
    }

    load() {
        let data = this.props.obj;
        if (data) {
            if (data.hasOwnProperty("supression")) {
                this.setState({ issupress: data.supression })
            }
            else {
                this.setState({ issupress: false })
            }

            if (data.hasOwnProperty("listmall")) {
                this.setState({ islistmall: data.listmall })
            }
            else {
                this.setState({ islistmall: false })
            }
        }
    }

    //type = supress or listmall
    async changeState(type, newState) {
        //toggle=true&alertid=4gepWyq
        let id = this.state.data.id;
        id = id.substring(id.indexOf('_') + 1, id.length);

        let key = this.state.data.key;
        key = key.substring(0, key.indexOf('#'));

        let val = this.state.data.key;
        val = val.substring(val.indexOf('#') + 1, val.length);

        try {
            const response = await querySrv("api/alertapi/" + type + "?toggle=" + newState + "&alertid=" + id + "&keyname=cstm%23" + key + "&keyval=" + encodeURIComponent(val), {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            var jsonData = await response.json();

            if (jsonData.statusCode && jsonData.statusCode === 404) {
                alert(jsonData.statusDescription);
                return;
            }

            this.setState({ ["is" + type]: newState });
        } catch (error) {
            console.error(error);
            alert("Problem with receiving data. " + error);
            return;
        }

    }



    render() {
        return (
            <span>
                {(this.state.islistmall === false || !this.state.islistmall) && <img className="icon" style={{ "maxHeight": "25px" }} alt="list them all" src={listthemAll} onClick={() => this.changeState("listmall", true)} title="list them all" />}
                {this.state.islistmall === true && <img className="icon" style={{ "maxHeight": "25px" }} alt="unlist them all" src={unlistthemAll} onClick={() => this.changeState("listmall", false)} title="unlist them all" />}
                {(this.state.issupress === false || !this.state.issupress) && <img className="icon" alt="suppressIcon" src={suppressIcon} onClick={() => this.changeState("supress", true)} title="suppress alert" />}
                {this.state.issupress === true && <img className="icon" alt="suppressIcon" src={unsuppressIcon} onClick={() => this.changeState("supress", false)} title="unsuppress alert" />}
            </span>
        )
    }
}

export default AdvancedProfile;


