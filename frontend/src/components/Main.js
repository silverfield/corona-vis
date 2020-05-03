import {
    HashRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import {useEffect} from "react"
import { DataProvider, useData } from '../contexts/DataProvider'
import World from './mains/World'
import Compare from './mains/Compare'

function Content({

}) {
    const {loadWorld} = useData();

    useEffect(() => {
        loadWorld('');
    }, []);

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

export default function Main({

}) {
    return (
        <>
            <DataProvider>
                <Content/>
            </DataProvider>
        </>
    );
  }
  