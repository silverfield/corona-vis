'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';
import './css/styles.scss';
import {autocomplete} from './autocomplete'
import { brush } from "d3";
window.dc = dc;
window.d3 = d3;

// -------------------------------------------------------
// Global vars
// -------------------------------------------------------

var glData = null;

// -------------------------------------------------------
// On doc. ready
// -------------------------------------------------------

$(document).ready(function() {
    let pingTimeMs = 1000*60*1;
    
    function pingServer() {
        jQuery.get('/ping', function() {

        });

        setTimeout(pingServer, pingTimeMs);
    }
    // pingServer();

    $("#log-scale").change(function(e) {
        dc.redrawAll();
    });

    $("#mode-world").click(function(e) {
        $('#mode-world-ctrls').show();
        $('#mode-compare-ctrls').hide();
        $('#mode-world').addClass('mode-active');
        $('#mode-compare').removeClass('mode-active');
    });

    $("#mode-compare").click(function(e) {
        $('#mode-world-ctrls').hide();
        $('#mode-compare-ctrls').show();
        $('#mode-compare').addClass('mode-active');
        $('#mode-world').removeClass('mode-active');
    });

    jQuery.get('/countries', function(countries) {
        ['search-country', 'country-1', 'country-2'].forEach(i => {
            autocomplete(document.getElementById(i), countries['countries']);
        })
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

    $("#clear-search-country").click(function(e) {
        $('#search-country').val('');
    });

    $("#clear-country-1").click(function(e) {
        $('#country-1').val('');
    });

    $("#clear-country-2").click(function(e) {
        $('#country-2').val('');
    });

    ['#search-country'].forEach(id => {
        $(id).keyup(function(e) {
            if (e.which == 13) {
                reloadChart();
            }
        });
    })
    
    reloadChart()
});

function getMode() {
    if ($('#mode-compare').hasClass('mode-active')) {
        return 'compare';
    }

    return 'world';
}

function isLogScale() {
    return $('#log-scale').is(":checked");
}

function isContinent() {
    return $('#continent').is(":checked");
}

function reloadChart() {
    $('#loader-container').show();
    $('#content').hide();

    let request = null;

    if (getMode() === 'compare') {
        $('#row-google-mob-single').hide();
        $('#row-google-mob-all').show();
        $('#row-by-country').hide();
        
        let country1 = $('#country-1').val();
        let country2 = $('#country-2').val();
        let countries = [country1, country2];
        let requests = countries.map(c => `/one-country?country=${c}`);

        let promises = requests.map(r => d3.csv(r));

        Promise.all(promises).then(function(results) {
            let errored = results.map(r => {
                if (r['error']) {
                    $('#loader-container').hide();
                    $('#content').show();
                    $('#error-msg').text(result['error']);
                    return true;
                }

                return false;
            })

            if (errored.some(e => e === true)) {
                return;
            }
            
            glData = {
                [countries[0]]: results[0],
                [countries[1]]: results[1]
            }

            const dateFormatParser = d3.timeParse('%Y-%m-%d');

            countries.forEach(country => {
                glData[country].forEach(d => {
                    d.date = dateFormatParser(d.date);
                });
            });
    
            redrawCompareMode();
        }).catch(function(err) {

        })
    }
    else {
        $('#row-google-mob-single').show();
        $('#row-google-mob-all').hide();
        $('#row-by-country').show();

        let searchCountry = $('#search-country').val();
        request = `/data?search-country=${searchCountry}`;

        d3.csv(request).then(resData => {
            // prep data ----------------------------------------
        
            glData = resData;
    
            const dateFormatParser = d3.timeParse('%Y-%m-%d');
    
            glData.forEach(d => {
                d.date = dateFormatParser(d.date);
            });
    
            redrawAllMode();
        })
    }
}

function avgCalc(value) {
    return value.count > 0 ? value.total / value.count : null;
}

function logScale(sourceGroup) {
    return {
        all: function() {
            if (isLogScale()) {
                return sourceGroup.all().map(i => {
                    return {
                        key: i.key,
                        value: Math.log10(i.value)
                    }
                });
            }
            
            return sourceGroup.all();
        }
    }
}

function removeEmpty(sourceGroup) {
    return {
        all:function () {
            let filtered = sourceGroup.all().filter(function(i) {
                if (i.value.count !== undefined) {
                    return avgCalc(i.value) != null;
                }
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

function createTotalCasesByCountryChart(cf, ) {
    window.totalCasesByCountryChart = new dc.RowChart('#totalCasesByCountryChart');
    let chart = window.totalCasesByCountryChart;

    function setDimGroup() {
        let dimension = isContinent() ? cf.dimension(d => d.continent) : cf.dimension(d => d.country);
        let group = dimension.group().reduceSum(d => d.cases);

        chart
            .dimension(dimension)
            .group(group)        
    }
    setDimGroup();

    $("#continent").change(function(e) {
        resetChart(totalCasesByCountryChart);
        setDimGroup();
        dc.redrawAll();
    });

    chart
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

function createEvolutionChart(
    cfs, 
    meta, 
    chartId, 
    reduceFunc,
    colors, 
    names, 
    enableLog,
) {
    let compositeChart = new dc.CompositeChart(`#${chartId}`);
    window[chartId] = compositeChart;

    let charts = cfs.map((cf, i) => {
        let chart = new dc.LineChart(compositeChart)

        let dimension = cf.dimension(d => d.date);
        let group = reduceFunc(dimension.group());
        group = removeEmpty(group);
        if (enableLog === true) {
            group = logScale(group);
        }

        let name = names ? names[i] : null;

        chart
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

        return chart
    })

    compositeChart
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
        compositeChart.legend(dc.legend().x(80).y(0).itemHeight(13).gap(5));
    }

    compositeChart.yAxis()
        .tickFormat(function(l) { 
            if (isLogScale() && (enableLog === true)) {
                let res = Math.pow(10, Number(l));
                res = Math.round(res);
                return res;
            }
            return l;
        });
    
    rotate_ticks(compositeChart, true);
}


function getAvgGroupFunctions(accessorFunc) {
    function reduceAdd(p, v) {
        if (accessorFunc(v) !== "") {
            ++p.count;
            if (p.total === null) {
                p.total = 0;
            }
            p.total += Number(accessorFunc(v));
        }
        return p;
    }
    
    function reduceRemove(p, v) {
        if (accessorFunc(v) !== "") {
            --p.count;
            if (p.count === 0) {
                p.total = null;
            }
            else {
                if (p.total === null) {
                    p.total = 0;
                }
                p.total -= Number(accessorFunc(v));
            }
        }
        return p;
    }
    
    function reduceInitial() {
        return {count: 0, total: null};
    }

    return [reduceAdd, reduceRemove, reduceInitial];
}

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


function createGoogleMobilityChart(chart, cf, meta) {
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
    
    rotate_ticks(chart, true);

    return chart
}

function drawLegendToggles(chart) {
    chart
        .selectAll('g.dc-legend .dc-legend-item')
        .style('opacity', function (d, i) {
            var subchart = chart.select('g.sub._' + i);
            var visible = subchart.style('stroke-opacity') === '1';
            return visible ? 1 : 0.5;
        });
}

function legendToggle(chart) {
    chart
        .selectAll('g.dc-legend .dc-legend-item')
        .on('click.hideshow', function (d, i) {
            var subchart = chart.select('g.sub._' + i);
            var visible = subchart.style('stroke-opacity') === '1';
            subchart.style('stroke-opacity', function() {
                return visible ? 0.1 : 1;
            });

            var subchart = chart.select('g.sub._' + ((i + 6) % 12));
            subchart.style('stroke-opacity', function() {
                return visible ? 0.1 : 1;
            });
      
            drawLegendToggles(chart);
        })
    drawLegendToggles(chart);
}


function createGoogleMobilityChartAll(
    cfs, 
    meta,
    countries
) {
    window.mobilityChartAll = new dc.CompositeChart('#mobilityChartAll');

    let countryCharts = cfs.map((cf, i) => {
        let charts = mobilityAccessors.map((o) => {
            let [dimension, group] = getMobilityDimGroup(cf, o.accessor);

            let chart = new dc.LineChart(mobilityChartAll)
                .dimension(dimension)
                .colors(o.color)
                .valueAccessor(function(p) { return p.value.count > 0 ? p.value.total / p.value.count : null; })
                .group(group, `${countries[i]} - ${o.accessor}`)
                ;
            
            chart.dashStyle([(i > 0 ? 2 : 10), 2]);

            return chart;
        });

        return charts;
    });


    mobilityChartAll
        .x(d3.scaleTime().domain([meta['minDate'], meta['maxDate']]))
        .height(300)
        .elasticX(true)
        .elasticY(true)
        .transitionDuration(500)
        .margins({top: 0, right: 50, bottom: 40, left: 70})
        .yAxisPadding(70)
        .renderHorizontalGridLines(true)
        .controlsUseVisibility(true)
        .legend(dc.legend().x(80).y(0).itemHeight(13).gap(3).highlightSelected(true))
        .compose(countryCharts[0].concat(countryCharts[1]))
        .brushOn(false)
        ;

    mobilityChartAll.on('pretransition.hideshow', legendToggle);
    mobilityChartAll.on('postRender', () => {
        mobilityChartAll
            .selectAll('g.dc-legend .dc-legend-item')
            .style('opacity', (d, i) => {
                var subchart = mobilityChartAll.select('g.sub._' + i);
                subchart.style('stroke-opacity', () => 0.1);
                return 0.5;
            });
    });
    
    rotate_ticks(mobilityChartAll, true);
}


function redrawAllMode() {
    if (glData === null) {
        return;
    }

    dc.chartRegistry.clear();

    $('#loader-container').show();
    $('#content').hide();

    let meta = {
        'minDate': Math.min(...glData.map((d) => d.date)),
        'maxDate': Math.max(...glData.map((d) => d.date))
    };

    // prep the cross filters ----------------------------------------

    const cf = crossfilter(glData);

    // total cases by country

    createTotalCasesByCountryChart(cf);

    // evolution graphs ----------------------------------------

    createEvolutionChart(
        [cf],
        meta,
        'totalCasesInTimeChart',
        g => g.reduceSum(d => d.tot_cases),
        ['blue'],
        null,
        true
    );

    createEvolutionChart(
        [cf], 
        meta,
        'newCasesInTimeChart',
        g => g.reduceSum(d => d.cases),
        ['blue'],
        null,
        true
    );

    createEvolutionChart(
        [cf], 
        meta,
        'totalDeathsInTimeChart',
        g => g.reduceSum(d => d.tot_deaths),
        ['red'],
        null,
        true
    );

    createEvolutionChart(
        [cf], 
        meta,
        'newDeathsInTimeChart',
        g => g.reduceSum(d => d.deaths),
        ['red'],
        null,
        true
    );

    createEvolutionChart(
        [cf], 
        meta,
        'stringencyChart',
        g => g.reduce(...getAvgGroupFunctions(v => v.stringency)),
        ['green'],
        null,
        false
    );
    
    let evolutionCharts = [
        totalCasesInTimeChart, 
        newCasesInTimeChart,
        totalDeathsInTimeChart,
        newDeathsInTimeChart,
        stringencyChart
    ];

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
    
    $('#loader-container').hide();
    $('#content').show();
    dc.renderAll();
}


function redrawCompareMode() {
    if (glData === null) {
        return;
    }

    dc.chartRegistry.clear();

    $('#loader-container').show();
    $('#content').hide();

    let metas = Object.keys(glData).map(c => {
        return {
            'minDate': Math.min(...glData[c].map((d) => d.date)),
            'maxDate': Math.max(...glData[c].map((d) => d.date))
        }
    });

    let meta = {
        'minDate': Math.min(...Object.keys(metas).map(m => m['minDate'])),
        'maxDate': Math.max(...Object.keys(metas).map(m => m['maxDate']))
    }

    // prep the cross filters ----------------------------------------

    const cfs = Object.keys(glData).map(c => crossfilter(glData[c]));

    // evolution graphs ----------------------------------------

    createEvolutionChart(
        cfs,
        meta,
        'totalCasesInTimeChart',
        g => g.reduceSum(d => d.tot_cases),
        ['blue', 'green'],
        Object.keys(glData),
        true
    );

    createEvolutionChart(
        cfs, 
        meta,
        'newCasesInTimeChart',
        g => g.reduceSum(d => d.cases),
        ['blue', 'green'],
        Object.keys(glData),
        true
    );

    createEvolutionChart(
        cfs, 
        meta,
        'totalDeathsInTimeChart',
        g => g.reduceSum(d => d.tot_deaths),
        ['blue', 'green'],
        Object.keys(glData),
        true
    );

    createEvolutionChart(
        cfs, 
        meta,
        'newDeathsInTimeChart',
        g => g.reduceSum(d => d.deaths),
        ['blue', 'green'],
        Object.keys(glData),
        true
    );

    createEvolutionChart(
        cfs, 
        meta,
        'stringencyChart',
        g => g.reduce(...getAvgGroupFunctions(v => v.stringency)),
        ['blue', 'green'],
        Object.keys(glData),
        false
    );
    
    let evolutionCharts = [
        totalCasesInTimeChart, 
        newCasesInTimeChart,
        totalDeathsInTimeChart,
        newDeathsInTimeChart,
        stringencyChart
    ];

    // mobility chart

    createGoogleMobilityChartAll(cfs, meta, Object.keys(glData));

    // resets

    let allCharts = [...evolutionCharts, mobilityChartAll];

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
    
    $('#loader-container').hide();
    $('#content').show();
    dc.renderAll();
}