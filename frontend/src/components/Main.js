import {
    HashRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import World from './mains/World'
import Compare from './mains/Compare'

export default function Main({

}) {
    return (
        <>
            <Router>
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
        </>
    );
  }
  