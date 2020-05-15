import * as d3 from "d3";
import * as dc from 'dc';
import {units} from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {getAvgGroupFunctions, avgCalc, ResetButton, randomId, removeEmpty, rotateTicks, logScale, popScale} from '../../helpers/chartHelper'


function buildChart({
    cf, 
    country,
    meta, 
    chart, 
    color, 
    mtrCols,
}) {
    let dimension = cf.dimension(d => d.date);

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
            return mtrCols.map((c, k) => {
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
    
    chart
        .barPadding(0.2)
        .outerPadding(0.5)
        .y(d3.scaleLinear().domain([0, 1]))
        .dimension(dimension)
        .group(g, country)
        .colors(color)
        .x(d3.scaleOrdinal())
        .xUnits(units.ordinal)
        .height(250)
        .brushOn(false)
        .transitionDuration(500)
        .margins({top: 20, right: 20, bottom: 120, left: 30})
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        ;

    if (country) {
        chart.legend(dc.legend().x(20).y(0).itemHeight(13).gap(5));
    }

    rotateTicks(chart, true, -65, -50, -10);

    chart.xAxis().tickFormat(function(l) { 
        return l.slice(6);
    });
}

export function StringencyMeasuresChart({
    data,
    title,
    colors,
    byCountry=false,
    note=null
}) {
    const [chart1, setChart1] = useState(null);
    const [chart2, setChart2] = useState(null);
    var ids = [randomId(), randomId()];

    useEffect(() => {
        if (byCountry) {
            let newChart1 = new dc.BarChart(`#${ids[0]}`)
            let newChart2 = new dc.BarChart(`#${ids[1]}`)
            setChart1(newChart1);
            setChart2(newChart2);
            data.addChart(newChart1);
            data.addChart(newChart2);

            var countries = [... new Set(data.data.map(d => d.country))];
            buildChart({
                cf: data.countryCfs[countries[0]],
                meta: data.meta,
                chart: newChart1,
                color: colors[0],
                mtrCols: data.mtrCols,
                country: countries[0]
            });
            buildChart({
                cf: data.countryCfs[countries[1]],
                meta: data.meta,
                chart: newChart2,
                color: colors[1],
                mtrCols: data.mtrCols,
                country: countries[1],
            });
        }
        else {
            let newChart = new dc.BarChart(`#${ids[0]}`)
            setChart1(newChart);
            data.addChart(newChart);

            buildChart({
                cf: data.cf,
                meta: data.meta,
                chart: newChart,
                color: '#3D9970',
                mtrCols: data.mtrCols,
                country: null
            });
        }
    }, [data.cf]);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={byCountry ? [chart1, chart2] : chart1}/>
        {note ? <><br/><i className="chart-note">{note}</i></> : <></>}
        <div className="stringency-charts">
            <div id={ids[0]} className="bar-chart"/>
            {byCountry ? <div id={ids[1]} className="bar-chart"/> : <></>}
        </div>
    </>
}