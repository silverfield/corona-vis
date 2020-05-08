import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {ResetButton, getAvgGroupFunctions, rotateTicks, enableLegendToggle} from '../../helpers/chartHelper'

var mobilityAccessors = [
    {
        'accessor': 'pc_retail_and_recreation',
        'color': 'red'
    },
    {
        'accessor': 'pc_grocery_and_pharmacy',
        'color': 'blue'
    },
    {
        'accessor': 'pc_parks',
        'color': 'orange'
    },
    {
        'accessor': 'pc_transit_stations',
        'color': 'yellow'
    },
    {
        'accessor': 'pc_workplaces',
        'color': 'green'
    },
    {
        'accessor': 'pc_residential',
        'color': 'navy'
    },
];

function getMobilityDimGroup(cf, accessor) {
    let dimension = cf.dimension(d => d.date);

    let funcs = getAvgGroupFunctions(v => v[accessor]);
    let group = dimension.group().reduce(...funcs);

    let filteredGroup = {
        'all': function () {
            return group.all().filter(function(d) {
                return d.value.count > 0;
            })
        }
    };

    return [dimension, filteredGroup];
}

function createChart(id, cf, meta) {
    let chart = new dc.CompositeChart(`#${id}`);

    let composeCharts = mobilityAccessors.map((o) => {
        let [dimension, group] = getMobilityDimGroup(cf, o.accessor);

        return new dc.LineChart(chart)
            .dimension(dimension)
            .colors(o.color)
            .valueAccessor(function(p) { return p.value.count > 0 ? p.value.total / p.value.count : null; })
            .group(group, o.accessor)
            .dashStyle([2,2])
    });

    chart
        .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .height(300)
        .elasticX(true)
        .elasticY(true)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .yAxisPadding(70)
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        .legend(dc.legend().x(100).y(0).itemHeight(13).gap(5))
        .compose(composeCharts)
        .brushOn(false)
        ;

    enableLegendToggle(chart);
    
    rotateTicks(chart, true);

    return chart
}

export function GoogleMobilityChart({
    data,
    id,
    title,
    note
}) {
    const [chart, setChart] = useState(null);

    useEffect(() => {
        let newChart = createChart(id, data.cf, data.meta);
        setChart(newChart);
        data.addChart(newChart);
    }, [data.cf]);

    return <>
        <span className="chart-title">{title}</span>
        <ResetButton chart={chart}/>
        <br/>
        <i className="chart-note">{note}</i>
        <div id={id} className="evolution-chart"/>
    </>
}