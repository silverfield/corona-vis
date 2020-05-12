import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {ResetButton, resetChart, rotateTicks, randomId, popScale} from '../../helpers/chartHelper'
import { min } from "d3";

function setDimGroup({
    chart, 
    cf, 
    isContinent,
    isScalePop,
    minCases,
    dimensionWrap
}) {
    if (dimensionWrap.length > 0) {
        dimensionWrap.forEach(d => {
            d.dispose(); 
            dimensionWrap.pop();
        });
    }
    let dimension = isContinent ? cf.dimension(d => d.continent) : cf.dimension(d => d.country);
    dimensionWrap.push(dimension);

    function reduceAdd(p, v) {
        p.total += v.cases;
        p.totalPop += v.population;
        return p;
    }
    
    function reduceRemove(p, v) {
        p.total -= v.cases;
        p.totalPop -= v.population;
        return p;
    }
    
    function reduceInitial() {
        return { total: 0, totalPop: 0 };
    }

    let group = dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);    

    let filteredGroup = {
        all: function() {
            return group.all().filter(i => i.value.total > minCases)
        }
    }

    let topEntries = filteredGroup.all();
    let accessorFunc = function(p) {
        if (isScalePop) {
            if (p.value.totalPop == 0) return null;

            return p.value.total / p.value.totalPop;
        }

        return p.value.total;
    }
    let compareFunc = function(a, b) {return accessorFunc(b) - accessorFunc(a)};
    topEntries = topEntries.sort(compareFunc);
    topEntries = topEntries.map(e => e.key).slice(0, 10);

    let topGroup = {
        all: function() {
            return filteredGroup.all().filter(i => topEntries.includes(i.key)).sort(compareFunc);
        }
    }

    chart
        .dimension(dimension)
        .group(topGroup)
        .valueAccessor(accessorFunc);
}

function createChart({
    id, 
    cf, 
    isContinent,
    isScalePop,
    minCases,
    dimensionWrap
}) {
    let chart = new dc.RowChart(`#${id}`);

    setDimGroup({
        chart: chart, 
        cf: cf, 
        isContinent: isContinent,
        isScalePop: isScalePop,
        minCases: minCases,
        dimensionWrap: dimensionWrap
    });

    chart
        .elasticX(true)
        .controlsUseVisibility(true)
        .transitionDuration(500)
        .margins({top: 0, left: 10, right: 10, bottom: 45})
        .label(d => d.key)
        .title(d => d.value);

    rotateTicks(chart, false);

    return chart
}

export function CountryChart({
    data
}) {
    const [chart, setChart] = useState(null);
    var dimensionWrap = [];
    var [isContinent, setIsContinent] = useState(false);
    var [isScalePop, setIsScalePop] = useState(false);
    var [minCases, setMinCases] = useState(0);
    var id = randomId();

    useEffect(() => {
        let newChart = createChart({
            id: id, 
            cf: data.cf, 
            isContinent: isContinent,
            isScalePop: isScalePop,
            minCases: minCases,
            dimensionWrap: dimensionWrap
        });
        setChart(newChart);
        data.addChart(newChart);
    }, [data.cf]);

    let refreshDimGroup = () => setDimGroup({
        chart: chart, 
        cf: data.cf, 
        isContinent: isContinent,
        isScalePop: isScalePop,
        minCases: minCases,
        dimensionWrap: dimensionWrap
    });

    function changeContinent(newIsContinent) {
        isContinent = newIsContinent;
        resetChart(chart);
        
        setTimeout(() => {
            refreshDimGroup();
            setTimeout(() => dc.redrawAll());
        })
    };

    function changeIsScalePop(newIsScalePop) {
        isScalePop = newIsScalePop;
        resetChart(chart);
        
        setTimeout(() => {
            refreshDimGroup();
            setTimeout(() => dc.redrawAll());
        })
    };

    function changeMinCases(newMinCases) {
        minCases = newMinCases;
        resetChart(chart);
        
        setTimeout(() => {
            refreshDimGroup();
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
            <div className="control">
                <label className="country-label" htmlFor="min-cases">Min cases</label>
                <input 
                    type="number" 
                    id="min-cases" 
                    name="min-cases" 
                    defaultValue="0"
                    onChange={(e) => changeMinCases(e.target.value)}/>
            </div>
        </div>
        <span className="chart-title">Total cases by country/continent (top 10)</span>
        <ResetButton chart={chart}/>
        <div id={id} className="country-bar"/>
    </>
}