import {
    HashRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import { DataProvider, useData } from '../contexts/DataProvider'
import { ChartProvider, useCharts } from '../contexts/ChartProvider'
import World from './mains/World'
import Compare from './mains/Compare'

function Content({

}) {
    return <Router>
        <Switch>
            <Route path="/" exact component={() => { 
                window.location.href = '#/world'; 
                return null;
            }}/>
            <Route path="/world">
                <World />
            </Route>

            <Route path="/compare" >
                <Compare />
            </Route>
        </Switch>
    </Router>
}

function ResetAllCharts({

}) {
    const {resetAllCharts} = useCharts();

    return <div className="reset-all-div">
        <a className='reset-all' onClick={resetAllCharts}>
            Reset all charts
        </a>
    </div>
}

export default function Main({

}) {
    return (
        <>
            <DataProvider>
            <ChartProvider>
                <ResetAllCharts/>
                <Content/>
            </ChartProvider>
            </DataProvider>
        </>
    );
  }
  