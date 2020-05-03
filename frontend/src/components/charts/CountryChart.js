import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {resetChart, rotateTicks} from '../../helpers/chartHelper'

function setDimGroup(chart, cf, isContinent) {
    let dimension = isContinent ? cf.dimension(d => d.continent) : cf.dimension(d => d.country);
    let group = dimension.group().reduceSum(d => d.cases);

    chart
        .dimension(dimension)
        .group(group)
}

function createChart(cf, isContinent) {
    let chart = new dc.RowChart('#totalCasesByCountryChart');

    setDimGroup(chart, cf, isContinent);

    chart
        .cap(10)
        .elasticX(true)
        .controlsUseVisibility(true)
        .transitionDuration(500)
        .margins({top: 0, left: 10, right: 10, bottom: 45})
        .label(d => d.key)
        .title(d => d.value);

    rotateTicks(chart, true);

    return chart
}

export function CountryChart({

}) {
    const {cf} = useData();
    // const [isContinent, setIsContinent] = useState(false);
    var chart = null;

    useEffect(() => {
        chart = createChart(cf, false);
    });

    function changeContinent(newIsContinent) {
        resetChart(chart);
        setDimGroup(chart, cf, newIsContinent);
        dc.redrawAll();
    };

    return <div id="row-by-country" className="row">
        <div className="col-md-12">
            <div className="loc-controls">
                <div className="control">
                    <input 
                        type="checkbox" 
                        id="continent" 
                        name="continent" 
                        onChange={(e) => changeContinent(e.target.checked)}/>
                    <label htmlFor="continent">Continents</label>
                </div>
            </div>
            <span className="chart-title">Total cases by country/continent (top 10)</span>
            <a 
                className='reset'
                onClick={() => resetChart(chart, true)}
            >
                (reset)
            </a>
            <div id='totalCasesByCountryChart' className="country-bar">
                
            </div>
        </div>
    </div>
}