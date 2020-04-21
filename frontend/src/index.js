'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';
import './css/styles.scss';
import {autocomplete} from './autocomplete'
window.dc = dc;
window.d3 = d3;

$(document).ready(function() {
    jQuery.get('/countries', function(countries) {
        autocomplete(document.getElementById("search-country"), countries['countries']);
    });

    jQuery.get('/max-dates', function(maxDates) {
        for (let k in maxDates) {
            document.getElementById(`data-when-${k}`).innerText = (new Date(maxDates[k])).toDateString();
        };
    });

    $("#log-scale").change(function(e) {
        redrawAll();
    });

    $("#controls").submit(function(e) {
        e.preventDefault();
        reloadChart();
    });

    $('#search-country').keyup(function(e) {
        if(e.which == 13) {
            reloadChart();
        }
    });

    reloadChart()
});

function isLogScale() {
    return $('#log-scale').is(":checked");
}

var data = null;

function reloadChart() {
    $('#loader').show();
    $('#content').hide();

    let searchCountry = $('#search-country').val();

    let request = `/data?search-country=${searchCountry}`

    d3.csv(request).then(resData => {    
        // prep data ----------------------------------------
    
        data = resData;

        const dateFormatParser = d3.timeParse('%Y-%m-%d');

        data.forEach(d => {
            d.date = dateFormatParser(d.date);
        });

        redrawAll();
    })
}

function redrawAll() {
    if (data === null) {
        return;
    }

    $('#loader').show();
    $('#content').hide();

    let minDate = Math.min(...data.map((d) => d.date));
    let maxDate = Math.max(...data.map((d) => d.date));

    // prep the cross filters ----------------------------------------

    const cf = crossfilter(data);
    const all = cf.groupAll();

    let dimension, group;

    // - picker which metric looking at
    // - ratio new cases/deaths
    // - smoothing

    function log_scale(source_group) {
        return {
            all: function() {
                return source_group.all().map(i => {
                    return {
                        key: i.key,
                        value: Math.log2(i.value)
                    }
                });
            }
        }
    }

    function remove_empty(source_group) {
        return {
            all:function () {
                let filtered = source_group.all().filter(function(i) {
                    return i.value != 0;
                });

                return filtered;
            }
        };
    }

    // total by countries ----------------------------------------

    window.totalCasesByCountryChart = new dc.RowChart('#totalCasesByCountryChart');

    dimension = cf.dimension(d => d.country)
    group = dimension.group().reduceSum(d => d.cases);

    totalCasesByCountryChart
        .dimension(dimension)
        .group(group)
        .cap(10)
        .elasticX(true)
        .controlsUseVisibility(true)
        .transitionDuration(500)
        .margins({top: 0, left: 10, right: 10, bottom: 45})
        .label(d => d.key)
        .title(d => d.value);

    // evolution graphs ----------------------------------------

    let evo_gr_transformation = function(group) {
        let g = remove_empty(group);

        if (isLogScale()) {
            g = log_scale(g);
        }

        return g;
    };

    window.totalCasesInTimeChart = new dc.LineChart('#totalCasesInTimeChart');

    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.tot_cases)

    totalCasesInTimeChart
        .dimension(dimension)
        .group(evo_gr_transformation(group));

    window.newCasesInTimeChart = new dc.BarChart('#newCasesInTimeChart');
    
    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.cases)

    newCasesInTimeChart
        .dimension(dimension)
        .group(evo_gr_transformation(group));

    window.totalDeathsInTimeChart = new dc.BarChart('#totalDeathsInTimeChart');

    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.tot_deaths)

    totalDeathsInTimeChart
        .dimension(dimension)
        .group(evo_gr_transformation(group))
        .colors(['red']);

    window.newDeathsInTimeChart = new dc.BarChart('#newDeathsInTimeChart');

    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.deaths)

    newDeathsInTimeChart
        .dimension(dimension)
        .group(evo_gr_transformation(group))
        .colors(['red']);

    let evolutionCharts = [
        totalCasesInTimeChart, 
        newCasesInTimeChart,
        totalDeathsInTimeChart,
        newDeathsInTimeChart
    ]

    evolutionCharts.forEach((chart) => {
        chart
            .x(d3.scaleTime().domain([minDate, maxDate]))
            .height(150)
            .elasticX(true)
            .elasticY(true)
            .transitionDuration(500)
            .margins({top: 0, right: 50, bottom: 40, left: 70})
            .renderHorizontalGridLines(true)
            .controlsUseVisibility(true)
            ;
    });

    // mobility chart

    window.mobilityChart = new dc.CompositeChart('#mobilityChart');

    function getDimGroup(accessor) {
        function reduceAdd(p, v) {
            if (v[accessor] !== "") {
                ++p.count;
                if (p.total === null) {
                    p.total = 0;
                }
                p.total += Number(v[accessor]);
            }
            return p;
        }
        
        function reduceRemove(p, v) {
            if (v[accessor] !== "") {
                --p.count;
                if (p.count === 0) {
                    p.total = null;
                }
                else {
                    if (p.total === null) {
                        p.total = 0;
                    }
                    p.total -= Number(v[accessor]);
                }
            }
            return p;
        }
        
        function reduceInitial() {
            return {count: 0, total: null};
        }

        let dimension = cf.dimension(d => d.date);
        let group = dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        let filteredGroup = {
            'all': function () {
                return group.all().filter(function(d) {
                    return d.value.count === 1;
                })
            }
        };

        return [dimension, filteredGroup];
    }
    
    let accessors = [
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
    let composeCharts = accessors.map((o) => {
        let [dimension, group] = getDimGroup(o.accessor);

        return new dc.LineChart(mobilityChart)
            .dimension(dimension)
            .colors(o.color)
            .valueAccessor(function(p) { return p.value.count > 0 ? p.value.total / p.value.count : null; })
            .group(group, o.accessor)
            .dashStyle([2,2])
    });

    mobilityChart
        .x(d3.scaleTime().domain([minDate, maxDate]))
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

    // rotate ticks

    let allCharts = [...evolutionCharts];
    allCharts.push(totalCasesByCountryChart);
    allCharts.push(mobilityChart); 

    allCharts.forEach((chart) => {
        chart.renderlet(function(chart){
            let tickSelector = "g.tick text";

            if ((evolutionCharts.includes(chart)) || (chart._anchor === '#mobilityChart')) {
                tickSelector = "g.x text";
            }

            chart
                .selectAll(tickSelector)
                .attr('transform', "rotate(-65) translate(-25 -10)");
        });
    });
    
    window.resetAll = function() {
        allCharts.forEach(c => resetChart(c, false))
        dc.redrawAll();
    }

    window.resetChart = function(chart, redraw) {
        if (evolutionCharts.includes(chart)) {
            chart.filterAll();
            // chart.x(d3.scaleTime().domain([minDate, maxDate]));
        }
        else {
            chart.filterAll()
        }

        if (redraw !== false) {
            dc.redrawAll();
        }
    };
    
    $('#loader').hide();
    $('#content').show();
    dc.renderAll();
}