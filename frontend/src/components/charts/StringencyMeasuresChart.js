import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {getAvgGroupFunctions, avgCalc, ResetButton, randomId, removeEmpty, rotateTicks, logScale, popScale} from '../../helpers/chartHelper'


function buildChart({
    cf, 
    countryCfs,
    meta, 
    chart, 
    colors, 
    countries=null,
    mtrCols
}) {
    console.log(mtrCols);
    console.log(colors);
    let makeCharts = (country, i) => {
        let _cf = country === null ? cf : countryCfs[country];

        let barChart = new dc.BarChart(chart);

        let dimension = _cf.dimension(d => d.date);

        // function reduceAdd(p, v) {
        //     if (accessorFunc(v) !== null) {
        //         ++p.count;
        //         if (p.total === null) {
        //             p.total = 0;
        //         }
        //         p.total += Number(accessorFunc(v));
        //     }
        //     return p;
        // }
        
        // function reduceRemove(p, v) {
        //     if (accessorFunc(v) !== null) {
        //         --p.count;
        //         if (p.count === 0) {
        //             p.total = null;
        //         }
        //         else {
        //             if (p.total === null) {
        //                 p.total = 0;
        //             }
        //             p.total -= Number(accessorFunc(v));
        //         }
        //     }
        //     return p;
        // }
        
        // function reduceInitial() {
        //     return {count: 0, total: null};
        // }
    
        // return [reduceAdd, reduceRemove, reduceInitial];

        let avgFuncs = getAvgGroupFunctions(d => d[mtrCol])
        let group = dimension.group().reduce(...avgFuncs);

        let g = {
            'all': () => {
                return mtrCols.map((c, i) => {
                    return {
                        'key': c,
                        'value': i
                    }
                });

                let keys = group.all().map(x => x.key);
                let maxKey = new Date(Math.max.apply(null, keys));

                let maxItems = group.all().filter(d => (d.key.getTime() === maxKey.getTime()) && (d.value.count > 0));
                if (maxItems.length === 0) {
                    return [];
                }
                
                return [{
                    key: mtrCol,
                    value: maxItems[0].value.total / maxItems[0].value.count
                }];
            }
        }
        console.log(g.all());
        
        barChart
            .dimension(dimension)
            .group(g, country)
            .colors(colors[i])
            ;

        return barChart;
    }
    
    // var charts = null;
    // if (countries !== null) {
    //     charts = countries.map(makeCharts);
    // }
    // else {
    let charts = [makeCharts(null, 0)];
    console.log(charts);
    // }

    // console.log(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]));
    chart
        .x(d3.scaleOrdinal().domain(mtrCols))
        // .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .elasticX(true)
        .elasticY(true)
        .height(150)
        .brushOn(false)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        .compose(charts)
        ;

    if (countries) {
        chart.legend(dc.legend().x(80).y(0).itemHeight(13).gap(5));
    }

    // rotateTicks(chart, true);
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
            mtrCols: data.mtrCols
        });
    }, [data.cf]);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={chart}/>
        {note ? <><br/><i className="chart-note">{note}</i></> : <></>}
        <div id={id} className="bar-chart"/>
    </>
}