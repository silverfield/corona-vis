import {
    HashRouter as Router,
    NavLink,
} from "react-router-dom";

import ScrollToTop from './ScrollToTop.js'

export default function Header({

}) {
    return (
        <>
            <h1 style={{'textAlign': 'center'}}>Covid-19 visualisation</h1>
            <div className="flex-container">
                <div>
                    Data from: <br/>
                    <a href="https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide">ECDC</a> - updated: <span id="data-when-ecdc">(loading)</span> <br/>
                    <a href="https://www.google.com/covid19/mobility/">Google</a> - updated: <span id="data-when-gmob">(loading)</span><br/>
                    <a href="https://www.bsg.ox.ac.uk/research/research-projects/coronavirus-government-response-tracker">Oxford university</a> - updated: <span id="data-when-oxford">(loading)</span>
                </div>

                <div style={{'textAlign': 'right'}}>
                    Made by Frantisek Hajnovic <br/>
                    Powered by <a href="https://dc-js.github.io/dc.js/">dc.js</a>, 
                    <a href="https://flask.palletsprojects.com/en/1.1.x/quickstart/">flask</a>
                    and <a href="https://heroku.com/">heroku</a> <br/>
                    Check out the code on <a href="https://github.com/silverfield/corona-vis">GitHub</a>
                </div>
            </div>
        </>
    );
}

function Menu({

}) {
    return (
        <nav className="menu">
            <Router>
                <ScrollToTop>
                <MenuItem to="/home" title="home"/>
                <MenuItem to="/my-music" title="my music" submenuItems={[
                    {to: '/my-music/everyday', title: 'everyday (demo album)'},
                    {to: '/my-music/originals', title: 'other originals'},
                    {to: '/my-music/covers', title: 'covers'},
                    {to: '/my-music/collaborations', title: 'collaborations'}
                ]}/>
                <MenuItem to="/busking" title="busking 4 good"/>
                <MenuItem to="/repertoire" title="repertoire"/>
                <MenuItem to="/about" title="about me"/>
                <MenuItem to="/contact" title="contact me"/>
                </ScrollToTop>
            </Router>
        </nav>
    );
  }
  


function PrimaryNav({

}) {
    return (
        <div id="primary-nav-wrap">
            <nav className="primary-nav">
                <Router>
                    <ScrollToTop>
                    <NavLink to="/home" className="main-link" activeClassName="active-link">home</NavLink>
                    <NavLink to="/my-music" className="main-link" activeClassName="active-link">my music</NavLink>
                    <NavLink to="/busking" className="main-link" activeClassName="active-link">busking 4 good</NavLink>
                    <NavLink to="/repertoire" className="main-link" activeClassName="active-link">repertoire</NavLink>
                    <NavLink to="/about" className="main-link" activeClassName="active-link">about me</NavLink>
                    <NavLink to="/contact" className="main-link" activeClassName="active-link">contact me</NavLink>
                    </ScrollToTop>
                </Router>
            </nav>

            <div id="header-title">Fero Hajnovič</div>
        </div>
    );
  }
  
  

