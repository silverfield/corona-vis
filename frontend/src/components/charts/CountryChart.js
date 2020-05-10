import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {ResetButton, resetChart, rotateTicks, randomId, popScale} from '../../helpers/chartHelper'

function setDimGroup({
    chart, 
    cf, 
    isContinent,
    isScalePop
}) {
    let dimension = isContinent ? cf.dimension(d => d.continent) : cf.dimension(d => d.country);
    let group = dimension.group().reduceSum(d => {
        if (isScalePop) {
            if (d.population === null || d.population === 0) return null;

            return d.cases / d.population;
        }
        
        return d.cases;
    });

    chart
        .dimension(dimension)
        .group(group)
}

function createChart({
    id, 
    cf, 
    isContinent,
    isScalePop
}) {
    let chart = new dc.RowChart(`#${id}`);

    setDimGroup({
        chart: chart, 
        cf: cf, 
        isContinent: isContinent,
        isScalePop: isScalePop
    });

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
    data
}) {
    const [chart, setChart] = useState(null);
    var isContinent = false;
    var isScalePop = false;

    var id = randomId();

    useEffect(() => {
        let newChart = createChart({
            id: id, 
            cf: data.cf, 
            isContinent: isContinent,
            isScalePop: isScalePop
        });
        setChart(newChart);
        data.addChart(newChart);
    }, [data.cf]);

    function changeContinent(newIsContinent) {
        isContinent = newIsContinent;
        resetChart(chart);
        
        setTimeout(() => {
            setDimGroup({
                chart: chart, 
                cf: data.cf, 
                isContinent: isContinent,
                isScalePop: isScalePop
            });
            setTimeout(() => dc.redrawAll());
        })
    };

    function changeIsScalePop(newIsScalePop) {
        isScalePop = newIsScalePop;
        resetChart(chart);
        
        setTimeout(() => {
            setDimGroup({
                chart: chart, 
                cf: data.cf, 
                isContinent: isContinent,
                isScalePop: isScalePop
            });
            setTimeout(() => dc.redrawAll());
        })
    };

    return <>
        <div className="loc-controls">
            <div className="control">
                <input 
                    type="checkbox" 
                    id="continent" 
                    name="continent" 
                    onChange={(e) => changeContinent(e.target.checked)}/>
                <label htmlFor="continent">Continents</label>
            </div>
            <div className="control">
                <input 
                    type="checkbox" 
                    id="pop-scale" 
                    name="pop-scale" 
                    onChange={(e) => changeIsScalePop(e.target.checked)}/>
                <label htmlFor="pop-scale">Scale by population</label>
            </div>
        </div>
        <span className="chart-title">Total cases by country/continent (top 10)</span>
        <ResetButton chart={chart}/>
        <div id={id} className="country-bar"/>
    </>
}