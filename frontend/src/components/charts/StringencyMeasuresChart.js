import * as d3 from "d3";
import * as dc from 'dc';
import {units} from 'dc';

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
    mtrCols,
}) {
    console.log(countries);

    let makeChart = (country, i) => {
        let _cf = country === null ? cf : countryCfs[country];

        let barChart = new dc.BarChart(chart);

        let dimension = _cf.dimension(d => d.date);

        function reduceAdd(m, v) {
            mtrCols.forEach(c => {
                if (v[c] !== null) {
                    ++m[c].count;
                    if (m[c].total === null) {
                        m[c].total = 0;
                    }
                    m[c].total += Number(v[c]);
                }
            });

            return m
        }
        
        function reduceRemove(m, v) {
            mtrCols.forEach(c => {
                if (v[c] !== null) {
                    --m[c].count;
                    if (m[c].count === 0) {
                        m[c].total = null;
                    }
                    else {
                        if (m[c].total === null) {
                            m[c].total = 0;
                        }
                        m[c].total -= Number(v[c]);
                    }
                }
            });

            return m;
        }
        
        function reduceInitial() {
            let m = {};
            mtrCols.forEach(c => {
                m[c] = {count: 0, total: null}
            });
            return m;
        }

        let group = dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

        let g = {
            'all': () => {
                return mtrCols.map(c => {
                    let okItems = group.all().filter(d => d.value[c].count > 0);
                    let maxKey = new Date(Math.max.apply(null, okItems.map(x => x.key)));
                    let maxItems = okItems.filter(d => d.key.getTime() === maxKey.getTime());

                    return {
                        key: c,
                        value: maxItems.length === 0 ? null : maxItems[0].value[c].total / maxItems[0].value[c].count
                    };
                });
            }
        }
        
        barChart
            .dimension(dimension)
            .group(g, country)
            .colors(colors[i])
            .x(d3.scaleOrdinal())
            .xUnits(units.ordinal)
            ;

        return barChart;
    }
    
    var charts = null;
    if (countries !== null) {
        charts = countries.map(makeChart);
    }
    else {
        charts = [makeChart(null, 0)];
    }

    chart
        .x(d3.scaleOrdinal().domain(mtrCols).range([0, 1000]))
        .xUnits(units.ordinal)
        .elasticY(true)
        .height(250)
        .brushOn(false)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 100, left: 70})
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
            mtrCols: data.mtrCols,
        });
    }, [data.cf]);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={chart}/>
        {note ? <><br/><i className="chart-note">{note}</i></> : <></>}
        <div id={id} className="bar-chart"/>
    </>
}