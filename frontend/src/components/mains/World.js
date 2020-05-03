import {useData} from '../../contexts/DataProvider'
import { useState, useEffect } from 'react';
import { Error } from '../Error'
import { Loader } from '../Loader'
import { CountryChart } from '../charts/CountryChart'
import { autoCompleteCountriesInput } from '../../helpers/autocomplete'

import * as dc from 'dc';

function WorldControls({

}) {
    const {data, loadWorld} = useData();
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
                            onChange={(e) => setSearchCountry(e.target.value)}
                            onKeyUp={(e) => { if (e.which == 13) submit()}}
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

function WorldContent({

}) {
    const {data} = useData();

    useEffect(() => {
        dc.renderAll();
    });

    return <>
        <CountryChart/>
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