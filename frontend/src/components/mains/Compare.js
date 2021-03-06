import {useData, usedata} from '../../contexts/DataProvider'
import { useState, useEffect } from 'react';
import React from 'react';
import { Error } from '../Error'
import { Loader } from '../Loader'
import { ResetAll } from '../ResetAll'
import { CountryChart } from '../charts/CountryChart'
import { EvolutionChart } from '../charts/EvolutionChart'
import { StringencyMeasuresChart } from '../charts/StringencyMeasuresChart'
import { GoogleMobilityChart } from '../charts/GoogleMobilityChart'
import { autoCompleteCountriesInput } from '../../helpers/autocomplete'
import {getAvgGroupFunctions, countryColors } from '../../helpers/chartHelper'

import * as d3 from "d3";
import * as dc from "dc";
import * as crossfilter from 'crossfilter';

function CompareControls({
    data
}) {
    const [country1, setCountry1] = useState('United Kingdom');
    const [country2, setCountry2] = useState('Germany');

    const _loadFunc = (callBack) => {
        let countries = [country1, country2];
        let requests = countries.map(c => `/one-country?country=${c}`);
        let promises = requests.map(r => d3.json(r));

        Promise.all(promises).then(function(results) {
            let errored = results.map(r => {
                if (r['error']) {
                    data.setError(r['error']);
                    return true;
                }

                return false;
            })

            if (errored.some(e => e === true)) {
                callBack(null);
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

            let newCountryCfs = {};
            countries.forEach((c) => {
                newCountryCfs[c] = crossfilter(resData.filter(d => d.country === c));
            });
            data.setCountryCfs(newCountryCfs);

            callBack(resData);
        }).catch(function(err) {
            data.setError(err.toString());
            callBack(null);
        });
    };

    function submit(event) {
        data.loadData(_loadFunc);
        if (event !== undefined) event.preventDefault();
    }

    useEffect(() => {
        data.loadData(_loadFunc);

        let setCountryArr = [setCountry1, setCountry2];

        [1, 2].forEach(index => autoCompleteCountriesInput(`country${index}`, setCountryArr[index - 1]));
    }, []);

    const countryInput = (country, setCountry, index) => {
        return <>
            <div className="input-wrap">
                <label className="country-label" htmlFor={`country${index}`}>Country {index}:</label>
                <div className="autocomplete input-div">
                    <input 
                        type="text" 
                        className="text-input"
                        id={`country${index}`}
                        // placeholder={defaultVal}
                        autoComplete="off"
                        value={country}
                        onChange={(e) => {
                            setCountry(e.target.value);
                        }}
                        onKeyUp={(e) => {
                            setCountry($(`#country${index}`).val());
                        }}
                    />
                </div>
                <input id={`clear-country${index}`} type="button" value="clear" onClick={() => setCountry('')} />
            </div>
        </>
    };

    return <>
        <form className="controls" autoComplete="false" onSubmit={submit}>
            <div className="main-controls">
                <div className="control">
                    {countryInput(country1, setCountry1, 1)}
                    <br/>
                    {countryInput(country2, setCountry2, 2)}
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
    title,
    reduceFunc,
    isLogScale,
    isScalePop
}) {
    return <EvolutionChart
        data={data}
        title={title}
        reduceFunc={reduceFunc}
        colors={countryColors}
        isLogScale={isLogScale}
        isScalePop={isScalePop}
        byCountry={true}
    />
}

function CompareContent({
    data
}) {
    let [isLogScaleState, setIsLogScaleState] = useState(false);
    let [isScalePopState, setIsScalePopState] = useState(false);

    window._isLogScaleCompare = isLogScaleState;
    window._isScalePopCompare = isScalePopState;

    let isLogScale = () => {
        return _isLogScaleCompare;
    };

    let isScalePop = () => {
        return _isScalePopCompare;
    };

    useEffect(() => {
        window._isLogScaleCompare = isLogScaleState;
        window._isScalePopCompare = isScalePopState;
        dc.renderAll();
    }, []);

    return <>
        <ResetAll resetAllCharts={data.resetAllCharts}/>
        <div className="evo-controls">
            <div className="control">
                <input 
                    type="checkbox" 
                    id="log-scale-compare" 
                    name="log-scale-compare" 
                    onChange={(e) => {
                        _isLogScaleCompare = e.target.checked;
                        setIsLogScaleState(_isLogScaleCompare);
                        dc.redrawAll();
                    }}/>
                <label htmlFor="log-scale-compare">Log scale (base 10)</label><br/>
            </div>
            <div className="control">
                <input 
                    type="checkbox" 
                    id="scale-pop-compare" 
                    name="scale-pop-compare" 
                    onChange={(e) => {
                        _isScalePopCompare = e.target.checked;
                        setIsScalePopState(_isScalePopCompare);
                        dc.redrawAll();
                    }}/>
                <label htmlFor="scale-pop-compare">Scale by population</label><br/>
            </div>
        </div>
        <div className="row evolution-top-row">
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}
                    title="Total cases in time"
                    reduceFunc={(g) => g.reduceSum(d => d.tot_cases)}
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}   
                    title="New cases in time"
                    reduceFunc={(g) => g.reduceSum(d => d.cases)}
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}
                    title="Total deaths in time"
                    reduceFunc={(g) => g.reduceSum(d => d.tot_deaths)}
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
            <div className="col-md-6">
                <CompareCasesChart
                    data={data}
                    title="New deaths in time"
                    reduceFunc={(g) => g.reduceSum(d => d.deaths)}
                    isLogScale={isLogScale}
                    isScalePop={isScalePop}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-12">
                <EvolutionChart
                    data={data}
                    title="Stringency index (Oxford uni.)"
                    note="Not available for all countries"
                    reduceFunc={(g) => g.reduceSum(d => d.stringency)}
                    colors={countryColors}
                    byCountry={true}
                    domain={[0, 1]}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-12">
                <StringencyMeasuresChart
                    data={data}
                    title="Stringency measures"
                    note="Each metric scaled to 0..1, where 1 = highest stringency. Displayes most recent values from the selected time period. Not available for all countries"
                    colors={countryColors}
                    byCountry={true}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-md-12">
                <GoogleMobilityChart
                    data={data}
                    title="Google mobility (% change from baseline)"
                    note="Not available for all countries"
                    byCountry={true}
                />
            </div>
        </div>
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