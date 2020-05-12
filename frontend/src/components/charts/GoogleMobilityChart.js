import * as d3 from "d3";
import * as dc from 'dc';

import {useEffect, useState} from "react"
import {useData} from '../../contexts/DataProvider'
import {randomId, ResetButton, getAvgGroupFunctions, rotateTicks, enableLegendToggle} from '../../helpers/chartHelper'

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

function getAvgMobilityDimGroup(cf, accessor) {
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

function getCountryMobilityDimGroup(cf, accessor, country) {
    let dimension = cf.dimension(d => d.date);

    let funcs = getAvgGroupFunctions(v => v.country !== country ? null : v[accessor]);
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

function createChart(
    id, 
    cf, 
    countryCfs,
    meta, 
    countries
) {
    let chart = new dc.CompositeChart(`#${id}`);

    const makeComposeCharts = (country, i) => {
        return mobilityAccessors.map((o) => {
            let composeChart = null;
            
            if (country === null) {
                let [dimension, group] = getAvgMobilityDimGroup(cf, o.accessor);

                composeChart = new dc.LineChart(chart)
                    .dimension(dimension)
                    .valueAccessor(function(p) { return p.value.count > 0 ? p.value.total / p.value.count : null; })
                    .group(group, o.accessor)
            }
            else {
                let [dimension, group] = getCountryMobilityDimGroup(countryCfs[country], o.accessor, country);

                composeChart = new dc.LineChart(chart)
                    .dimension(dimension)
                    .valueAccessor(function(p) { return p.value.count > 0 ? p.value.total / p.value.count : null; })
                    .group(group, `${countries[i]} - ${o.accessor}`)
            }

            composeChart
                .colors(o.color)
                .dashStyle([2 + i*5, 2]);

            return composeChart;
        });
    };

    var composeCharts = null;
    if (countries !== null) {
        composeCharts = countries.map(makeComposeCharts).flat();
    }
    else {
        composeCharts = makeComposeCharts(null, 0);
    }

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

    let legendDefaultOn = countries === null;
    let countriesLength = countries === null ? 1 : countries.length;
    let groupToogleFunc = (i) => [...Array(6*countriesLength).keys()].filter(x => x % 6 === i % 6);
    enableLegendToggle(chart, legendDefaultOn, groupToogleFunc);
    
    rotateTicks(chart, true);

    return chart
}

export function GoogleMobilityChart({
    data,
    title,
    note,
    byCountry=false
}) {
    const [chart, setChart] = useState(null);
    var id = randomId();

    useEffect(() => {
        var countries = null;
        if (byCountry) {
            countries = [... new Set(data.data.map(d => d.country))];
        };

        let newChart = createChart(
            id, 
            data.cf,
            data.countryCfs,
            data.meta, 
            countries
        );
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