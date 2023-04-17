/*
render menu list
input: array of dashboards to render
*/
import React from "react";
import { Link } from "react-router-dom";

/**
 * Capitalize first letter
 * @param {string}  dashboard name
 * @return {string} dashboard name with capital first letter
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * render all Link (react-router) to dashboards
 * @param {array}  dashboard list
 * @return {array} dashboard Links
 */
export const renderNavBar = (dashboards) => {
  var navBar = [];
  for (var i = 0; i < dashboards.length; i++) {
    if (dashboards[i] !== "web") {
      navBar.push(
        <Link
          to={"/" + dashboards[i]}
          id={"/" + dashboards[i]}
          className={window.location.pathname === "/" + dashboards[i]
            ? "activeDashboardDiv list-group-myitem list-group-item-action"
            : "bg-dark list-group-myitem list-group-item-action"}
          key={dashboards[i]}
        >
          <div className="d-flex w-100 justify-content-start align-items-center">
            <img
              className="marginRight"
              src={`icons/${dashboards[i]}.png`}
              alt={dashboards[i]}
            />
            <span
              className={window.location.pathname === "/" + dashboards[i]
                ? "menu-collapsed menuText activeDashboard"
                : "menu-collapsed menuText"}
            >
              {capitalizeFirstLetter(dashboards[i])}
            </span>
          </div>
        </Link>,
      );
    }
  }
  return navBar;
};
