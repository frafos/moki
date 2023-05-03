import { useCallback, useEffect, useState } from "react";
import { renderNavBar, logout } from '../../gui';

import store from '@/js/store';
import { setChartsWidth } from '@/js/slices';

import logoutIcon from "/icons/log_out.png";
import password from "/icons/password.png";
import collapseIcon from "/icons/collapse.png";

function NavBar(props) {
    const [collapsed, setCollapsed] = useState(false);

    // remove change password for LDAP users
    const isLDAPuser = (dashboardList) => {
        if (store.getState().persistent.user.userbackend !== "DB" && dashboardList.includes("changePassword")) {
            dashboardList.splice(dashboardList.indexOf("changePassword"));
        }
        return dashboardList;
    }

    let dashboardsUser = isLDAPuser(props.dashboardsUser);
    let dashboards = props.dashboards;
    let dashboardsSettings = props.dashboardsSettings;

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        const navBar = document.getElementById("sidebar-container");
        if (navBar.clientHeight < window.innerHeight) {
            navBar.style.position = "fixed";
            navBar.style.top = "0";
            navBar.style.bottom = "auto";
        }
        return (() => {
            window.removeEventListener("scroll", handleScroll);
        })
    }, [])

    const handleScroll = useCallback((_event) => {
        const navBar = document.getElementById("sidebar-container");
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
    }, []);

    const togglebar = () => {
        setCollapsed(!collapsed);
        const collapsedItems = document.getElementsByClassName(" menu-collapsed");
        let collapsedItemBar;
        if (!collapsed) {
            for (var i = 0; i < collapsedItems.length; i++) {
                collapsedItems[i].style.display = "none";
            }
            collapsedItemBar = document.getElementsByClassName("sidebar-expanded");
            collapsedItemBar[0].className = "sidebar-collapsed d-md-block";

            store.dispatch(setChartsWidth(window.innerWidth + 150));
            document.getElementsByClassName("margin250")[0].className = "margin70";
        }
        else {
            for (i = 0; i < collapsedItems.length; i++) {
                collapsedItems[i].style.display = "block";
            }
            collapsedItemBar = document.getElementsByClassName("sidebar-collapsed");
            collapsedItemBar[0].className = "sidebar-expanded d-md-block";

            store.dispatch(setChartsWidth(window.innerWidth));
            document.getElementsByClassName("margin70")[0].className = "margin250";

        }
    }


        let renderedDashboardsSettings = [...dashboardsSettings];
        let renderedDashboards = [...dashboards];

        const { settings } = store.getState().persistent;
        let shouldRemoveAlerts = false;

        if (settings && settings[0]) {
            for (const hit of settings[0].attrs) {
                if (hit.attribute === "disable_alarms") {
                    shouldRemoveAlerts = hit.value;
                }
            }
        }

        if (shouldRemoveAlerts) {
            let index = renderedDashboards.indexOf("exceeded");
            if (index > -1) {
                renderedDashboards.splice(index, 1);
            }
            index = renderedDashboardsSettings.indexOf("alarms");
            if (index > -1) {
                renderedDashboardsSettings.splice(index, 1);
            }
        }

        const navbar = renderNavBar(renderedDashboards);
        const navbarSettings = renderNavBar(renderedDashboardsSettings);

        //remove logout and changePassword, it's not dashboard, just link
        let userDash = [...dashboardsUser];
        if (userDash.indexOf("logout") !== -1) userDash.splice(userDash.indexOf("logout"), 1);
        if (userDash.indexOf("changePassword") !== -1) userDash.splice(userDash.indexOf("changePassword"), 1);

        let navbarUser = renderNavBar(userDash);

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
                    {dashboardsUser.includes("logout") && <a href="/logout" className="bg-dark list-group-myitem list-group-item-action" onClick={logout}>
                        <div className="d-flex w-100 justify-content-start align-items-center">
                            <img className="marginRight" src={logoutIcon} alt="transport" />
                            <span className="menu-collapsed menuText">Log out</span>
                        </div>
                    </a>
                    }
                    {dashboardsUser.includes("changePassword") && <a className="noFormatButton bg-dark list-group-collaps list-group-item-action d-flex align-items-center" href="/change_pw">
                        <div className="d-flex w-100 justify-content-start align-items-center">
                            <img className="marginRight" src={password} alt="transport" />
                            <span className="menu-collapsed menuText" style={{ "color": "white" }} >Change password</span>
                        </div>
                    </a>
                    }
                    <button onClick={togglebar} data-toggle="sidebar-colapse" className="noFormatButton bg-dark list-group-collaps list-group-item-action d-flex align-items-center" >
                        <div className="d-flex w-100 justify-content-start align-items-center">
                            <img className="marginRight" src={collapseIcon} alt="collapse" />
                            <span id="collapse-text" className="menu-collapsed">Collapse</span>
                        </div>
                    </button>

                </ul>

            </div>

        );
}

export default NavBar;
