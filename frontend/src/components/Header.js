import { useState, useEffect } from 'react';
import * as dc from "dc";

function MenuItem({
    title,
    value,
    route,
    setRoute
}) {
    return <span 
        onClick={() => {
            setRoute(value);
            setTimeout(() => dc.renderAll());
        }}
        className={'mode-select' + (route === value ? ' mode-active' : '')}
    >{title}</span>
}

export default function Header({
    route,
    setRoute
}) {
    const [dataWhen, setDataWhen] = useState({
        'ecdc': '(loading)',
        'gmob': '(loading)',
        'oxford': '(loading)',
    });

    useEffect(() => {
        jQuery.get('/max-dates', function(maxDates) {
            let keys = Object.keys(maxDates);
            let newDataWhen = keys.map(k => [k, (new Date(maxDates[k])).toDateString()])
            newDataWhen = Object.fromEntries(newDataWhen);

            setDataWhen(newDataWhen);
        });

        function pingServer() {
            jQuery.get('/ping', function() {
    
            });
    
            setTimeout(pingServer, pingTimeMs);
        }
        // pingServer();
    
    }, []);

    return (
        <header>
            <h1 style={{'textAlign': 'center'}}>Covid-19 visualisation</h1>
            <div className="flex-container">
                <div>
                    Data from: <br/>
                    <a href="https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide">ECDC</a> - updated: <span id="data-when-ecdc">{dataWhen['ecdc']}</span> <br/>
                    <a href="https://www.google.com/covid19/mobility/">Google</a> - updated: <span id="data-when-gmob">{dataWhen['gmob']}</span><br/>
                    <a href="https://www.bsg.ox.ac.uk/research/research-projects/coronavirus-government-response-tracker">Oxford university</a> - updated: <span id="data-when-oxford">{dataWhen['oxford']}</span>
                </div>

                <div style={{'textAlign': 'right'}}>
                    Made by Frantisek Hajnovic <br/>
                    Powered by <a href="https://dc-js.github.io/dc.js/">dc.js</a>, 
                    <a href="https://flask.palletsprojects.com/en/1.1.x/quickstart/">flask</a>
                    and <a href="https://heroku.com/">heroku</a> <br/>
                    Check out the code on <a href="https://github.com/silverfield/corona-vis">GitHub</a>
                </div>
            </div>

            <nav className="menu">
                <MenuItem title="World" value="world" setRoute={setRoute} route={route}/>
                <MenuItem title="Compare" value="compare" setRoute={setRoute} route={route}/>
            </nav>
        </header>
    );
}

