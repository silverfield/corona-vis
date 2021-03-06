import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {avgCalc, ResetButton, randomId, removeEmpty, rotateTicks, logScale, popScale} from '../../helpers/chartHelper'


function buildChart({
    cf, 
    countryCfs,
    meta, 
    chart, 
    reduceFunc,
    colors, 
    domain,
    isLogScale,
    isScalePop,
    countries=null
}) {
    let makeChart = (country, i) => {
        let lineChart = new dc.LineChart(chart)

        let _cf = country === null ? cf : countryCfs[country];

        let dimension = _cf.dimension(d => d.date);
        let group = dimension.group();
        
        group = reduceFunc(group);
        group = removeEmpty(group);
        group = logScale(group, isLogScale);

        let population = _cf.groupAll().reduceSum(d => d.population).value();
        group = popScale(group, isScalePop, population);

        lineChart
            .dimension(dimension)
            .group(group, country)
            .colors(colors[i])
            .valueAccessor(function(p) { 
                if (p.value.total !== undefined) {
                    return avgCalc(p.value); 
                }

                return p.value;
            })
            ;

        return lineChart
    }
    
    var charts = null;
    if (countries !== null) {
        charts = countries.map(makeChart);
    }
    else {
        charts = [makeChart(null, 0)];
    }

    chart
        .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .height(150)
        .elasticX(true)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        .compose(charts)
        ;

    if (domain === null) {
        chart.elasticY(true);
    }
    else {
        chart.y(d3.scaleLinear().domain(domain));
    }

    if (countries) {
        chart.legend(dc.legend().x(80).y(0).itemHeight(13).gap(5));
    }

    chart.yAxis()
        .tickFormat(function(l) { 
            if (isLogScale()) {
                let res = Math.pow(10, Number(l));
                res = Math.round(res);
                return res;
            }
            return l;
        });
    
    rotateTicks(chart, true);
}

export function EvolutionChart({
    data,
    title,
    reduceFunc,
    colors,
    isLogScale=() => false,
    isScalePop=() => false,
    byCountry=false,
    domain=null,
    note
}) {
    const [chart, setChart] = useState(null);
    var id = randomId();

    useEffect(() => {
        let newChart = new dc.CompositeChart(`#${id}`)
        setChart(newChart);
        data.addChart(newChart);

        var countries = null;
        if (byCountry) {
            countries = [... new Set(data.data.map(d => d.country))];
        };

        buildChart({
            cf: data.cf,
            countryCfs: data.countryCfs,
            meta: data.meta,
            chart: newChart,
            domain: domain,
            reduceFunc: reduceFunc,
            colors: colors,
            isLogScale: isLogScale,
            isScalePop: isScalePop,
            countries: countries,
        });
    }, [data.cf]);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={chart}/>
        {note ? <><br/><i className="chart-note">{note}</i></> : <></>}
        <div id={id} className="evolution-chart"/>
    </>
}