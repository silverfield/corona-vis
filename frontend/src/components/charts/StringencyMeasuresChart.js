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
    colors, 
    countries=null
}) {
    let makeChart = (country, i) => {
        let barChart = new dc.BarChart(chart)
        debugger;

        let _cf = country === null ? cf : countryCfs[country];

        let dimension = _cf.dimension(d => d.date);

        let cols = ['mtr_c_school_closing', 'mtr_c_workplace_closing'];

        function reduceAdd(p, v) {
            p[v.date] = v['mtr'];
            return p;
        }
        
        function reduceRemove(p, v) {
            delete p[v.date];
            return p;
        }
        
        function reduceInitial() {
            let p = {};
            return p;
        }
    
    
        let group = dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        
        barChart
            .x(d3.scaleBand())
            .dimension(dimension)
            .group(group, country)
            .colors(colors[i])
            .valueAccessor(function(p) { 
                if (Object.keys(p.value).length !== 0) {
                    return p[Math.max(...Object.keys(p.value))]; 
                }

                return null;
            })
            ;

        return barChart
    }
    
    var charts = null;
    if (countries !== null) {
        charts = countries.map(makeChart);
    }
    else {
        charts = [makeChart(null, 0)];
    }

    chart
        // .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .height(150)
        .elasticX(true)
        .elasticY(true)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        .compose(charts)
        ;

    if (countries) {
        chart.legend(dc.legend().x(80).y(0).itemHeight(13).gap(5));
    }

    rotateTicks(chart, true);
}

export function StringencyMeasuresChart({
    data,
    title,
    colors,
    byCountry=false,
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
            colors: colors,
            countries: countries,
        });
    }, [data.cf]);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={chart}/>
        {note ? <><br/><i className="chart-note">{note}</i></> : <></>}
        <div id={id} className="bar-chart"/>
    </>
}