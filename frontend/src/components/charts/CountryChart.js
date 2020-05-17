import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {ResetButton, resetChart, rotateTicks, randomId, popScale} from '../../helpers/chartHelper'
import { min } from "d3";

function setDimGroup({
    chart, 
    cf, 
    grouping,
    measure,
    minMax,
    isScalePop,
    threshold,
    dimensionWrap
}) {
    if (dimensionWrap.length > 0) {
        dimensionWrap.forEach(d => {
            d.dispose(); 
            dimensionWrap.pop();
        });
    }
    let dimension = grouping === 'continents' ? cf.dimension(d => d.continent) : cf.dimension(d => d.country);
    dimensionWrap.push(dimension);

    function reduceAdd(p, v) {
        p.total += v[measure];
        p.totalPop = v.population;
        return p;
    }
    
    function reduceRemove(p, v) {
        p.total -= v[measure];
        p.totalPop = v.population;
        return p;
    }
    
    function reduceInitial() {
        return { total: 0, totalPop: 0 };
    }

    let group = dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);    

    let filteredGroup = {
        all: function() {
            return group.all().filter(i => i.value.totalPop > threshold)
        }
    }

    let accessorFunc = function(p) {
        if (isScalePop) {
            if (p.value.totalPop == 0) return null;

            return p.value.total / p.value.totalPop;
        }

        return p.value.total;
    }
    let compareFunc = function(a, b) {
        return (minMax === 'max' ? accessorFunc(b) - accessorFunc(a) : accessorFunc(a) - accessorFunc(b));
    };

    let topGroup = {
        all: function() {
            let topEntries = filteredGroup.all();
            topEntries = topEntries.sort(compareFunc);
            topEntries = topEntries.map(e => e.key).slice(0, 10);
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
    grouping,
    measure,
    minMax,
    isScalePop,
    threshold,
    dimensionWrap
}) {
    let chart = new dc.RowChart(`#${id}`);

    setDimGroup({
        chart: chart, 
        cf: cf, 
        grouping: grouping,
        measure: measure,
        minMax: minMax,
        isScalePop: isScalePop,
        threshold: threshold,
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
    var [grouping, setGrouping] = useState('countries');
    var [measure, setMeasure] = useState('cases');
    var [minMax, setMinMax] = useState('max');
    var [isScalePop, setIsScalePop] = useState(false);
    var [threshold, setThreshold] = useState(0);
    var id = randomId();

    useEffect(() => {
        let newChart = createChart({
            id: id, 
            cf: data.cf, 
            grouping: grouping,
            measure: measure,
            minMax: minMax,
            isScalePop: isScalePop,
            threshold: threshold,
            dimensionWrap: dimensionWrap
        });
        setChart(newChart);
        data.addChart(newChart);
    }, [data.cf]);

    let refreshDimGroup = () => setDimGroup({
        chart: chart, 
        cf: data.cf, 
        grouping: grouping,
        measure: measure,
        minMax: minMax,
        isScalePop: isScalePop,
        threshold: threshold,
        dimensionWrap: dimensionWrap
    });

    function changeGrouping() {
        let newGrouping = (grouping == 'continents' ? 'countries' : 'continents');
        setGrouping(newGrouping);
        grouping = newGrouping;
        resetChart(chart);
        
        setTimeout(() => {
            refreshDimGroup();
            setTimeout(() => dc.redrawAll());
        })
    };

    function changeMeasure() {
        let newMeasure = (measure == 'deaths' ? 'cases' : 'deaths');
        setMeasure(newMeasure);
        measure = newMeasure;
        resetChart(chart);
        
        setTimeout(() => {
            refreshDimGroup();
            setTimeout(() => dc.redrawAll());
        })
    };

    function changeMinMax() {
        let newMinMax = (minMax == 'min' ? 'max' : 'min');
        setMinMax(newMinMax);
        minMax = newMinMax;
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

    function changeThreshold(newThreshold) {
        threshold = newThreshold;
        resetChart(chart);
        
        setTimeout(() => {
            refreshDimGroup();
            setTimeout(() => dc.redrawAll());
        })
    };

    return <>
        <div className="loc-controls">
            <div className="control">
                <div 
                    className="country-control-button"
                    onClick={(e) => changeMinMax()}
                >
                    {  
                        minMax === 'min' ? 
                        <><b>min</b>/max</> :
                        <>min/<b>max</b></>
                    }
                </div>
            </div>
            <div className="control">
                <div 
                    className="country-control-button"
                    onClick={(e) => changeGrouping()}
                >
                    {  
                        grouping === 'countries' ? 
                        <><b>countries</b>/continents</> :
                        <>countries/<b>continents</b></>
                    }
                </div>
            </div>
            <div className="control">
                <div 
                    className="country-control-button"
                    onClick={(e) => changeMeasure()}
                >
                    {  
                        measure === 'cases' ? 
                        <><b>cases</b>/deaths</> :
                        <>cases/<b>deaths</b></>
                    }
                </div>
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
                <label className="country-label" htmlFor="threshold">Min population</label>
                <input 
                    type="number" 
                    id="threshold" 
                    name="threshold" 
                    defaultValue="0"
                    onChange={(e) => changeThreshold(e.target.value)}/>
            </div>
        </div>
        <span className="chart-title">Total {measure} by {grouping} (top 10)</span>
        <ResetButton chart={chart}/>
        <div id={id} className="country-bar"/>
    </>
}