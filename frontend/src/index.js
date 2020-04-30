import React from "react";
import { render } from "react-dom";
import './css/styles.scss';
import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'

window.React = React;

if (document.getElementById("react-header")) {
    render(<Header />, document.getElementById("react-header"));
}

if (document.getElementById("react-main")) {
    render(<Main />, document.getElementById("react-main"));
}

if (document.getElementById("react-footer")) {
    render(<Footer />, document.getElementById("react-footer"));
}