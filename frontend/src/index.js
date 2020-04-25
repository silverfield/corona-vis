'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';
import './css/styles.scss';
import {autocomplete} from './autocomplete'
window.dc = dc;
window.d3 = d3;

// -------------------------------------------------------
// Global vars
// -------------------------------------------------------

var data = null;

// -------------------------------------------------------
// On doc. ready
// -------------------------------------------------------

$(document).ready(function() {
    jQuery.get('/countries', function(countries) {
        autocomplete(document.getElementById("search-country"), countries['countries']);
    });

    jQuery.get('/max-dates', function(maxDates) {
        for (let k in maxDates) {
            document.getElementById(`data-when-${k}`).innerText = (new Date(maxDates[k])).toDateString();
        };
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

function log_scale(source_group) {
    return {
        all: function() {
            if (isLogScale()) {
                return source_group.all().map(i => {
                    return {
                        key: i.key,
                        value: Math.log10(i.value)
                    }
                });
            }
            
            return source_group.all();
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

function rotate_ticks(chart, onlyX) {
    chart.on('renderlet', function(_chart) {
        let tickSelector = "g.tick text";

        if (onlyX) {
            tickSelector = "g.x text";
        }

        _chart
            .selectAll(tickSelector)
            .attr('transform', "rotate(-65) translate(-25 -10)");
    });
}

function createTotalCasesByCountryChart(cf) {
    window.totalCasesByCountryChart = new dc.RowChart('#totalCasesByCountryChart');
    let chart = window.totalCasesByCountryChart;

    let dimension = cf.dimension(d => d.country)
    let group = dimension.group().reduceSum(d => d.cases);

    chart
        .dimension(dimension)
        .group(group)
        .cap(10)
        .elasticX(true)
        .controlsUseVisibility(true)
        .transitionDuration(500)
        .margins({top: 0, left: 10, right: 10, bottom: 45})
        .label(d => d.key)
        .title(d => d.value);

    rotate_ticks(chart, true);

    return chart
}

function createEvolutionChart(cf, meta, chartId, valSelector, color) {
    let chart = new dc.LineChart(`#${chartId}`);
    window[chartId] = chart;

    let dimension = cf.dimension(d => d.date);
    let group = dimension.group().reduceSum(valSelector);

    chart
        .dimension(dimension)
        .group(log_scale(remove_empty(group)));

    chart
        .colors(color)
        .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .height(150)
        .elasticX(true)
        .elasticY(true)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true);

    chart.yAxis()
        .tickFormat(function(l) { 
            if (isLogScale()) {
                let res = Math.pow(10, Number(l));
                res = Math.round(res);
                return res;
            }
            return l;
        });
    
    rotate_ticks(chart, true);
}

function createGoogleMobilityChart(chart, cf, meta) {
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
    
    rotate_ticks(chart, true);

    return chart
}


function redrawAll() {
    if (data === null) {
        return;
    }

    dc.chartRegistry.clear();

    $('#loader').show();
    $('#content').hide();

    let meta = {
        'minDate': Math.min(...data.map((d) => d.date)),
        'maxDate': Math.max(...data.map((d) => d.date))
    };

    // prep the cross filters ----------------------------------------

    const cf = crossfilter(data);

    // total cases by country

    createTotalCasesByCountryChart(cf);

    // evolution graphs ----------------------------------------

    createEvolutionChart(
        cf,
        meta,
        'totalCasesInTimeChart',
        d => d.tot_cases,
        'blue'
    );

    createEvolutionChart(
        cf, 
        meta,
        'newCasesInTimeChart',
        d => d.cases,
        'blue'
    );

    createEvolutionChart(
        cf, 
        meta,
        'totalDeathsInTimeChart',
        d => d.tot_deaths,
        'red'
    );

    createEvolutionChart(
        cf, 
        meta,
        'newDeathsInTimeChart',
        d => d.deaths,
        'red'
    );
    
    let evolutionCharts = [
        totalCasesInTimeChart, 
        newCasesInTimeChart,
        totalDeathsInTimeChart,
        newDeathsInTimeChart
    ];

    $("#log-scale").change(function(e) {
        dc.redrawAll();
    });

    // mobility chart

    window.mobilityChart = new dc.CompositeChart('#mobilityChart');
    createGoogleMobilityChart(window.mobilityChart, cf, meta);

    // resets

    let allCharts = [...evolutionCharts, totalCasesByCountryChart, mobilityChart];

    window.resetChart = function(chart, redraw) {
        chart.filterAll();

        if (redraw !== false) {
            dc.redrawAll();
        }
    };

    window.resetAll = function() {
        allCharts.forEach(c => resetChart(c, false));
        dc.redrawAll();
    }
    
    $('#loader').hide();
    $('#content').show();
    dc.renderAll();
}