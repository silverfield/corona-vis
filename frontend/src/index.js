import React from "react";
import { render } from "react-dom";
import './css/styles.scss';
import Body from './components/Body'

import * as dc from "dc";
import $ from "jquery";

window.React = React;

if (document.getElementById("react-body")) {
    render(<Body />, document.getElementById("react-body"));
}

$(document).ready(function() {
    function resizedw(){
        dc.renderAll();
    }
    
    var doit;
    window.onresize = function(){
      clearTimeout(doit);
      doit = setTimeout(resizedw, 100);
    };
});