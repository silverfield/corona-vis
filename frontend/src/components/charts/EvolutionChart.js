import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {ResetButton, removeEmpty, rotateTicks, logScale} from '../../helpers/chartHelper'


function buildChart({
    cfs, 
    meta, 
    chart, 
    reduceFunc,
    colors, 
    names, 
    isLogScale,
}) {
    let charts = cfs.map((cf, i) => {
        let lineChart = new dc.LineChart(chart)

        let dimension = cf.dimension(d => d.date);
        let group = reduceFunc(dimension.group());
        group = removeEmpty(group);
        group = logScale(group, isLogScale);

        let name = names ? names[i] : null;

        lineChart
            .dimension(dimension)
            .group(group, name)
            .colors(colors[i])
            .valueAccessor(function(p) { 
                if (p.value.total !== undefined) {
                    return avgCalc(p.value); 
                }

                return p.value;
            })
            ;

        return lineChart
    })

    chart
        .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .height(150)
        .elasticX(true)
        .elasticY(true)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        .compose(charts)
        ;

    if (names) {
        chart.legend(dc.legend().x(80).y(0).itemHeight(13).gap(5));
    }

    chart.yAxis()
        .tickFormat(function(l) { 
            if (isLogScale) {
                let res = Math.pow(10, Number(l));
                res = Math.round(res);
                return res;
            }
            return l;
        });
    
    rotateTicks(chart, true);
}

export function EvolutionChart({
    id,
    title,
    reduceFunc,
    colors,
    names,
    isLogScale
}) {
    const {cf, meta, addChart} = useData();
    const [chart, setChart] = useState(null);
    let cfs = Array.isArray(cf) ? cf : [cf];

    useEffect(() => {
        let newChart = new dc.CompositeChart(`#${id}`)
        setChart(newChart);
        addChart(newChart);

        buildChart({
            cfs: cfs,
            meta: meta,
            chart: newChart,
            reduceFunc: reduceFunc,
            colors: colors,
            names: names,
            isLogScale: isLogScale
        });
    }, []);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={chart}/>
        <div id={id} className="evolution-chart"/>
    </>
}