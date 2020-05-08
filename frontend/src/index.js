import React from "react";
import { render } from "react-dom";
import './css/styles.scss';
import Body from './components/Body'

window.React = React;

if (document.getElementById("react-body")) {
    render(<Body />, document.getElementById("react-body"));
}