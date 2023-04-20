import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "font-awesome/css/font-awesome.min.css";

import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/style.scss";
import "./gui/src/style/style.css";
import App from "./App";

// import * as serviceWorker from './serviceWorker';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
//serviceWorker.unregister();
// serviceWorker.register();
