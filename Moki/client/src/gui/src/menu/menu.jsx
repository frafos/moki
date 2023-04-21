/*
render menu list
input: array of dashboards to render
*/
import React from "react";
import { Link, NavLink } from "react-router-dom";

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
  for (const dashboard of dashboards) {
    if (dashboard !== "web") {
      navBar.push(
        <NavLink
          to={"/" + dashboard}
          id={"/" + dashboard}
          className={({ isActive }) => (
            "list-group-myitem list-group-item-action " +
            (isActive ? "activeDashboardDiv" : "bg-dark")
          )}
          key={dashboard}
        >
          {({ isActive }) => {
            return (
              <div className="d-flex w-100 justify-content-start align-items-center">
                <img
                  className="marginRight"
                  src={`icons/${dashboard}.png`}
                  alt={dashboard}
                />
                <span
                  className={"menu-collapsed menuText " +
                    (isActive ? "activeDashboard" : "")}
                >
                  {capitalizeFirstLetter(dashboard)}
                </span>
              </div>
            );
          }}
        </NavLink>,
      );
    }
  }
  return navBar;
};
