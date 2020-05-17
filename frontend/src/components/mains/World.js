import { usedata} from '../../contexts/DataProvider'
import { useState, useEffect } from 'react';
import { Error } from '../Error'
import { Loader } from '../Loader'
import { ResetAll } from '../ResetAll'
import { CountryChart } from '../charts/CountryChart'
import { EvolutionChart } from '../charts/EvolutionChart'
import { GoogleMobilityChart } from '../charts/GoogleMobilityChart'
import { StringencyMeasuresChart } from '../charts/StringencyMeasuresChart'
import { autoCompleteCountriesInput } from '../../helpers/autocomplete'
import {getAvgGroupFunctions} from '../../helpers/chartHelper'

import * as d3 from "d3";
import * as dc from "dc";
import * as crossfilter from 'crossfilter';

function WorldControls({
    data
}) {
    const [searchCountry, setSearchCountry] = useState('');

    useEffect(() => {
        autoCompleteCountriesInput('search-country', setSearchCountry);
    }, []);

    const _loadFunc = (callBack) => {
        let request = `/data?search-country=${searchCountry}`;

        d3.json(request).then(resData => {
            const dateFormatParser = d3.timeParse('%Y-%m-%d');
    
            resData.forEach(d => {
                d.date = dateFormatParser(d.date);
            });

            let newCf = crossfilter(resData);
            data.setCf(newCf);

            let newMeta = {
                'minDate': Math.min(...resData.map((d) => d.date)),
                'maxDate': Math.max(...resData.map((d) => d.date))
            };
            data.setMeta(newMeta);
    
            callBack(resData);
        }).catch(function(err) {
            data.setError(err.toString());
            callBack(null);
        });;
    };

    function submit(event) {
        setTimeout(() => data.loadData(_loadFunc));
        if (event !== undefined) event.preventDefault();
    }

    useEffect(() => {
        data.loadData(_loadFunc);
    }, []);

    return <>
        <form className="controls" autoComplete="false" onSubmit={submit}>
            <div className="main-controls">
                <div className="control">
                    <div className="input-wrap">
                        <label className="country-label" htmlFor="search-country">Search country:</label>
                        <div className="autocomplete input-div">
                            <input 
                                type="text" 
                                id="search-country" 
                                className="text-input"
                                placeholder="leave empty for all..."
                                autoComplete="off"
                                value={searchCountry}
                                onChange={(e) => {
                                    setSearchCountry(e.target.value);
                                }}
                                onKeyUp={(e) => {
                                    setSearchCountry($('#search-country').val());
                                    e.preventDefault();
                                    if (e.which == 13) submit(); 
                                }}
                            />
                        </div>
                        <input id="clear-search-country" type="button" value="clear" onClick={() => setSearchCountry('')} />
                    </div>
                </div>
            </div>

            <div className="submit">
                <input type="submit" />
            </div>
        </form>
    </>
}

function WorldCasesChart({
    data,
    title,
    reduceFunc,
    color,
    isLogScale,
    isScalePop
}) {
    return <EvolutionChart
        data={data}
        title={title}
        reduceFunc={reduceFunc}
        colors={[color]}
        names={null}
        isLogScale={isLogScale}
        isScalePop={isScalePop}
    />
}

function WorldContent({
    data
}) {
    let [isLogScaleState, setIsLogScaleState] = useState(false);
    let [isScalePopState, setIsScalePopState] = useState(false);

    window._isLogScaleWorld = isLogScaleState;
    window._isScalePopWorld = isScalePopState;
    
    let isLogScale = () => {
        return _isLogScaleWorld;
    };
    let isScalePop = () => {
        return _isScalePopWorld;
    };

    useEffect(() => {
        window._isLogScaleWorld = isLogScaleState;
        window._isScalePopWorld = isScalePopState;
        dc.renderAll();
    }, []);

    return <>
        <ResetAll resetAllCharts={data.resetAllCharts}/>
        <div id="row-by-country" className="row">
            <div className="col-md-12">
                <CountryChart 
                    data={data}
                />
            </div>
        </div>
        <div className="evo-controls">
            <div className="control">
                <input 
                    type="checkbox" 
                    id="log-scale-world" 
                    name="log-scale-world"
                    value={isLogScaleState} 
                    onChange={(e) => {
                        _isLogScaleWorld = e.target.checked;
                        setIsLogScaleState(_isLogScaleWorld);
                        dc.redrawAll();
                    }}/>
                <label htmlFor="log-scale-world">Log scale (base 10)</label><br/>
            </div>
            <div className="control">
                <input 
                    type="checkbox" 
                    id="scale-pop-world" 
                    name="scale-pop-world" 
                    onChange={(e) => {
                        _isScalePopWorld = e.target.checked;
                        setIsScalePopState(_isScalePopWorld);
                        dc.redrawAll();
                    }}/>
                <label htmlFor="scale-pop-world">Scale by population</label><br/>
            </div>
        </div>
        <div className="row evolution-top-row">
            <div className="col-md-6">
                <WorldCasesChart
                    data={data}
                    title="Total cases in time"
                    reduceFunc={(group) => group.reduceSum(d => d.tot_cases)}
                    color="blue"
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
            <div className="col-md-6">
                <WorldCasesChart
                    data={data}   
                    title="New cases in time"
                    reduceFunc={(group) => group.reduceSum(d => d.cases)}
                    color="blue"
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-6">
                <WorldCasesChart
                    data={data}
                    title="Total deaths in time"
                    reduceFunc={(group) => group.reduceSum(d => d.tot_deaths)}
                    color="red"
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
            <div className="col-md-6">
                <WorldCasesChart
                    data={data}
                    title="New deaths in time"
                    reduceFunc={(group) => group.reduceSum(d => d.deaths)}
                    color="red"
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-12">
                <EvolutionChart
                    data={data}
                    title="Avg. stringency index (Oxford uni.)"
                    note="Not available for all countries"
                    reduceFunc={(g) => g.reduce(...getAvgGroupFunctions(v => v.stringency))}
                    colors={['green']}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-12">
                <StringencyMeasuresChart
                    data={data}
                    title="Stringency measures"
                    note="Each metric scaled to 0..1, where 1 = highest stringency. Displayes most recent values from the selected time period, averaged across countries. Not available for all countries"
                    colors={['green']}
                />
            </div>
        </div>
        <div id="row-google-mob-single" className="row">
            <div className="col-md-12">
                <GoogleMobilityChart
                    data={data}
                    title="Google mobility (% change from baseline)"
                    note="If more than one country is selected, shows average. Not available for all countries"
                />
            </div>
        </div>
    </>
}

export default function World({
    data
}) {
    return <>
        <WorldControls data={data}/>
        <Error error={data.error}/>
        <Loader loading={data.loading}/>
        {(data.data !== null && !data.loading) ? <WorldContent data={data}/> : <></>}
    </>
}