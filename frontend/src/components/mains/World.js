import {useData} from '../../contexts/DataProvider'
import { useState, useEffect } from 'react';
import { Error } from '../Error'
import { Loader } from '../Loader'
import { ResetAll } from '../ResetAll'
import { CountryChart } from '../charts/CountryChart'
import { EvolutionChart } from '../charts/EvolutionChart'
import { GoogleMobilityChart } from '../charts/GoogleMobilityChart'
import { autoCompleteCountriesInput } from '../../helpers/autocomplete'

import * as dc from 'dc';

function WorldControls({

}) {
    const {loadWorld} = useData();
    const [searchCountry, setSearchCountry] = useState('');

    useEffect(() => {
        autoCompleteCountriesInput('search-country');
    }, []);

    function submit() {
        loadWorld(searchCountry);
    }

    return <>
        <form className="controls" autoComplete="false" onSubmit={submit}>
            <div className="main-controls">
                <div className="control">
                    <label htmlFor="search-country">Search country:</label>
                    <div className="autocomplete" style={{'width': '300px'}}>
                        <input 
                            type="text" 
                            id="search-country" 
                            placeholder="leave empty for all..."
                            autoComplete="off"
                            value={searchCountry}
                            onChange={(e) => {
                                setSearchCountry(e.target.value);
                            }}
                            onKeyUp={(e) => { 
                                setSearchCountry($('#search-country').val());
                                if (e.which == 13) submit(); 
                            }}
                        />
                    </div>
                    <input id="clear-search-country" type="button" value="clear" onClick={() => setSearchCountry('')} />
                </div>
            </div>

            <div className="submit">
                <input type="submit" />
            </div>
        </form>
    </>
}

function WorldCasesChart({
    id,
    title,
    reduceFunc,
    color,
    isLogScale
}) {
    return <EvolutionChart
        id={id}
        title={title}
        reduceFunc={reduceFunc}
        colors={[color]}
        names={null}
        isLogScale={isLogScale}
    />
}

function WorldContent({

}) {
    const [isLogScale, setIsLogScale] = useState(false);

    useEffect(() => {
        dc.renderAll();
    }, []);

    return <>
        <ResetAll/>
        <div id="row-by-country" className="row">
            <div className="col-md-12">
                <CountryChart/>
            </div>
        </div>
        <div className="evo-controls">
            <div className="control">
                <input 
                    type="checkbox" 
                    id="log-scale" 
                    name="log-scale" 
                    onChange={(e) => {
                        setIsLogScale(e.target.checked);
                        dc.redrawAll();
                    }}/>
                <label htmlFor="log-scale">Log scale (base 10)</label><br/>
            </div>
        </div>
        <div className="row evolution-top-row">
            <div className="col-md-6">
                <WorldCasesChart
                    id="totalCasesInTimeChart"
                    title="Total cases in time"
                    reduceFunc={g => g.reduceSum(d => d.tot_cases)}
                    color="blue"
                    isLogScale={isLogScale}
                />
            </div>
            <div className="col-md-6">
                <WorldCasesChart
                    id="newCasesInTimeChart"
                    title="New cases in time"
                    reduceFunc={g => g.reduceSum(d => d.cases)}
                    color="blue"
                    isLogScale={isLogScale}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-6">
                <WorldCasesChart
                    id="totalDeathsInTimeChart"
                    title="Total deaths in time"
                    reduceFunc={g => g.reduceSum(d => d.tot_deaths)}
                    color="red"
                    isLogScale={isLogScale}
                />
            </div>
            <div className="col-md-6">
                <WorldCasesChart
                    id="newDeathsInTimeChart"
                    title="New deaths in time"
                    reduceFunc={g => g.reduceSum(d => d.deaths)}
                    color="red"
                    isLogScale={isLogScale}
                />
            </div>
        </div>
        <div id="row-google-mob-single" className="row">
            <div className="col-md-12">
                <GoogleMobilityChart
                    id="mobilityChart"
                    title="Google mobility (% change from baseline)"
                    note="If more than one country is selected, shows average. Some countries don't have the data"
                />
            </div>
        </div>
    </>
}

export default function World({

}) {
    const {data} = useData();

    return <>
        <WorldControls/>
        <Error/>
        <Loader/>        
        {data !== null ? <WorldContent/> : <></>}
    </>
}