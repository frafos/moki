import React, {
    Component
} from 'react';
import store from "../store/index";
import { setWidthChart } from "../actions/index";
import { renderNavBar, logout } from '../../gui';
import storePersistent from "../store/indexPersistent";

import logoutIcon from "/icons/log_out.png";
import password from "/icons/password.png";
import collapseIcon from "/icons/collapse.png";

class navBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false,
            dashboards: this.props.dashboards,
            dashboardsSettings: this.props.dashboardsSettings,
            dashboardsUser: this.isLDAPuser(this.props.dashboardsUser)

        };
        this.togglebar = this.togglebar.bind(this);
        this.updateState = this.updateState.bind(this);
        storePersistent.subscribe(() => this.updateState());
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.dashboards !== this.props.dashboards) {
            this.setState({ dashboards: nextProps.dashboards });
        }
        if (nextProps.dashboardsSettings !== this.props.dashboardsSettings) {
            this.setState({ dashboardsSettings: nextProps.dashboardsSettings });
        }
        if (nextProps.dashboardsUser !== this.props.dashboardsUser) {
            this.setState({ dashboardsUser: this.isLDAPuser(nextProps.dashboardsUser) });
        }

    }
    //remove change password for LDAP users
    isLDAPuser(dashboardList) {
        if (storePersistent.getState().user.userbackend !== "DB" && dashboardList.includes("changePassword")) {
            dashboardList.splice(dashboardList.indexOf("changePassword"));
        }
        return dashboardList;
    }

    updateState() {
        this.setState({
            dashboards: this.props.dashboards,
            dashboardsSettings: this.props.dashboardsSettings,
            dashboardsUser: this.isLDAPuser(this.props.dashboardsUser)

        })
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll);
        var navBar = document.getElementById("sidebar-container");
        if (navBar.clientHeight < window.innerHeight) {
            navBar.style.position = "fixed";
            navBar.style.top = "0";
            navBar.style.bottom = "auto";

        }
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll(event) {
        var navBar = document.getElementById("sidebar-container");
        if (navBar.clientHeight - window.innerHeight > 0) {
            //navbar is longer than page
            if (window.pageYOffset + window.innerHeight <= navBar.clientHeight + 1) {
                navBar.style.position = "sticky";
                navBar.style.bottom = "auto";
                navBar.style.top = "auto";
            }
            else if (window.pageYOffset > (navBar.clientHeight - window.innerHeight)) {
                navBar.style.position = "fixed";
                navBar.style.bottom = "0";
                navBar.style.top = "auto";
            }
            else {
                navBar.style.position = "sticky";
                navBar.style.bottom = "auto";
                navBar.style.top = "0";
            }
        }

    }

    togglebar() {
        this.setState({
            collapsed: !this.state.collapsed
        });
        var collapsedItems = document.getElementsByClassName(" menu-collapsed");
        if (!this.state.collapsed) {
            for (var i = 0; i < collapsedItems.length; i++) {
                collapsedItems[i].style.display = "none";
            }

            var collapsedItemBar = document.getElementsByClassName("sidebar-expanded");
            collapsedItemBar[0].className = "sidebar-collapsed d-md-block";
            store.dispatch(setWidthChart(window.innerWidth + 150));
            document.getElementsByClassName("margin250")[0].className = "margin70";
        }
        else {
            for (i = 0; i < collapsedItems.length; i++) {
                collapsedItems[i].style.display = "block";
            }

            collapsedItemBar = document.getElementsByClassName("sidebar-collapsed");
            collapsedItemBar[0].className = "sidebar-expanded d-md-block";

            store.dispatch(setWidthChart(window.innerWidth));
            document.getElementsByClassName("margin70")[0].className = "margin250";

        }

    }


    render() {
        var dashboardsSettings = [...this.state.dashboardsSettings];
        var dashboards = [...this.state.dashboards];

        let shouldRemoveAlerts = false;
        if (storePersistent.getState().settings && storePersistent.getState().settings[0]) {
            for (let hit of storePersistent.getState().settings[0].attrs) {
                if (hit.attribute === "disable_alarms") {
                    shouldRemoveAlerts = hit.value;
                }
            }
        }

        if (shouldRemoveAlerts) {
            let index = dashboards.indexOf("exceeded");
            if (index > -1) {
                dashboards.splice(index, 1);
            }

            index = dashboardsSettings.indexOf("alarms");
            if (index > -1) {
                dashboardsSettings.splice(index, 1);
            }
        }

        var navbar = renderNavBar(dashboards);
        var navbarSettings = renderNavBar(dashboardsSettings);

        //remove logout and changePassword, it's not dashboard, just link
        var userDash = [...this.state.dashboardsUser];
        if (userDash.indexOf("logout") !== -1) userDash.splice(userDash.indexOf("logout"), 1);
        if (userDash.indexOf("changePassword") !== -1) userDash.splice(userDash.indexOf("changePassword"), 1);

        var navbarUser = renderNavBar(userDash);

        return (
            <div id="sidebar-container" className="sidebar-expanded d-none d-md-block">
                <ul className="list-group">
                    <li className="list-group-myitem sidebar-separator-title d-flex align-items-center menu-collapsed" style={{ "height": "38px" }}>
                        <small className="menu-collapsed">DASHBOARDS</small>
                    </li>
                    {navbar}
                    {navbarSettings.length > 0 && <li className="list-group-myitem sidebar-separator-title d-flex align-items-center menu-collapsed">
                    </li>}
                    {navbarSettings}

                    <li className="list-group-myitem sidebar-separator-title d-flex align-items-center menu-collapsed">

                    </li>

                    {navbarUser}
                    {this.state.dashboardsUser.includes("logout") && <a href="/logout" className="bg-dark list-group-myitem list-group-item-action" onClick={logout}>
                        <div className="d-flex w-100 justify-content-start align-items-center">
                            <img className="marginRight" src={logoutIcon} alt="transport" />
                            <span className="menu-collapsed menuText">Log out</span>
                        </div>
                    </a>
                    }
                    {this.state.dashboardsUser.includes("changePassword") && <a className="noFormatButton bg-dark list-group-collaps list-group-item-action d-flex align-items-center" href="/change_pw">
                        <div className="d-flex w-100 justify-content-start align-items-center">
                            <img className="marginRight" src={password} alt="transport" />
                            <span className="menu-collapsed menuText" style={{ "color": "white" }} >Change password</span>
                        </div>
                    </a>
                    }
                    <button onClick={this.togglebar} data-toggle="sidebar-colapse" className="noFormatButton bg-dark list-group-collaps list-group-item-action d-flex align-items-center" >
                        <div className="d-flex w-100 justify-content-start align-items-center">
                            <img className="marginRight" src={collapseIcon} alt="collapse" />
                            <span id="collapse-text" className="menu-collapsed">Collapse</span>
                        </div>
                    </button>

                </ul>

            </div>

        );
    }
}

export default navBar;
