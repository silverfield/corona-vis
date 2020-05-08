import {useData, usedata} from '../../contexts/DataProvider'
import { useState, useEffect } from 'react';
import { Error } from '../Error'
import { Loader } from '../Loader'
import { ResetAll } from '../ResetAll'
import { CountryChart } from '../charts/CountryChart'
import { EvolutionChart } from '../charts/EvolutionChart'
import { GoogleMobilityChart } from '../charts/GoogleMobilityChart'
import { autoCompleteCountriesInput } from '../../helpers/autocomplete'

import * as d3 from "d3";
import * as dc from "dc";
import * as crossfilter from 'crossfilter';

function CompareControls({
    data
}) {
    const [country1, setCountry1] = useState('');
    const [country2, setCountry2] = useState('');

    useEffect(() => {
        autoCompleteCountriesInput('country1');
        autoCompleteCountriesInput('country2');
    }, []);

    const _loadFunc = (callBack) => {
        let countries = [country1, country2];
        let requests = countries.map(c => `/one-country?country=${c}`);
        let promises = requests.map(r => d3.csv(r));

        Promise.all(promises).then(function(results) {
            let errored = results.map(r => {
                if (r['error']) {
                    data.setError(r['error']);
                    return true;
                }

                return false;
            })

            if (errored.some(e => e === true)) {
                return;
            }
            
            let resData = [];
            results.forEach((r) => {
                resData = resData.concat(r)
            });

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
        });
    };

    function submit(event) {
        data.loadData(_loadFunc);
        event.preventDefault();
    }

    useEffect(() => {
        data.loadData(_loadFunc);
    }, []);

    const CountryInput = ({index, defaultVal, country, setCountry}) => <>
        <label htmlFor="search-country">Country {index}:</label>
        <div className="autocomplete" style={{'width': '300px'}}>
            <input 
                type="text" 
                id={`country${index}`}
                placeholder={defaultVal}
                autoComplete="off"
                value={country}
                onChange={(e) => {
                    setCountry(e.target.value);
                }}
                onKeyUp={(e) => { 
                    setCountry($(`#country${index}`).val());
                    if (e.which == 13) submit(); 
                }}
            />
        </div>
        <input id={`clear-country${index}`} type="button" value="clear" onClick={() => setCountry('')} />
    </>

    return <>
        <form className="controls" autoComplete="false" onSubmit={submit}>
            <div className="main-controls">
                <div className="control">
                    <CountryInput index="1" defaultVal="United Kingdom" country={country1} setCountry={setCountry1}/>
                    <br/>
                    <CountryInput index="2" defaultVal="Germany" country={country2} setCountry={setCountry2}/>
                </div>
            </div>

            <div className="submit">
                <input type="submit" />
            </div>
        </form>
    </>
}

function CompareCasesChart({
    data,
    id,
    title,
    reduceFunc,
    color,
    isLogScale
}) {
    return <EvolutionChart
        data={data}
        id={id}
        title={title}
        reduceFunc={reduceFunc}
        colors={[color]}
        names={null}
        isLogScale={isLogScale}
    />
}

function CompareContent({
    data
}) {
    window._isLogScale = false;
    let isLogScale = () => {
        return _isLogScale;
    };

    useEffect(() => {
        dc.renderAll();
    }, []);

    return <>
        <ResetAll resetAllCharts={data.resetAllCharts}/>
        <div className="evo-controls">
            <div className="control">
                <input 
                    type="checkbox" 
                    id="log-scale" 
                    name="log-scale" 
                    onChange={(e) => {
                        _isLogScale = e.target.checked;
                        dc.redrawAll();
                    }}/>
                <label htmlFor="log-scale">Log scale (base 10)</label><br/>
            </div>
        </div>
        <div className="row evolution-top-row">
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}
                    id="totalCasesInTimeChart"
                    title="Total cases in time"
                    reduceFunc={g => g.reduceSum(d => d.tot_cases)}
                    color="blue"
                    isLogScale={isLogScale}
                />
            </div>
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}   
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
                <CompareCasesChart
                    data={data}
                    id="totalDeathsInTimeChart"
                    title="Total deaths in time"
                    reduceFunc={g => g.reduceSum(d => d.tot_deaths)}
                    color="red"
                    isLogScale={isLogScale}
                />
            </div>
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}
                    id="newDeathsInTimeChart"
                    title="New deaths in time"
                    reduceFunc={g => g.reduceSum(d => d.deaths)}
                    color="red"
                    isLogScale={isLogScale}
                />
            </div>
        </div>
        {/* <div id="row-google-mob-single" className="row">
            <div className="col-md-12">
                <GoogleMobilityChart
                    data={data}
                    id="mobilityChart"
                    title="Google mobility (% change from baseline)"
                    note="If more than one country is selected, shows average. Some countries don't have the data"
                />
            </div>
        </div> */}
    </>
}

export default function Compare({
    data
}) {
    return <>
        <CompareControls data={data}/>
        <Error error={data.error}/>
        <Loader loading={data.loading}/>
        {(data.data !== null && !data.loading) ? <CompareContent data={data}/> : <></>}
    </>
}