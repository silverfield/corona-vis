'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';
import './css/styles.scss';
window.dc = dc;
window.d3 = d3;

$(document).ready(function() {
    
});

d3.csv('/data').then(data => {    
    // prep data ----------------------------------------

    const dateFormatParser = d3.timeParse('%Y-%m-%d');

    data.forEach(d => {
        d.date = dateFormatParser(d.date);
    });

    window.minDate = Math.min(...data.map((d) => d.date));
    window.maxDate = Math.max(...data.map((d) => d.date));

    document.getElementById('data-when').innerText = (new Date(maxDate)).toDateString();

    // prep the cross filters ----------------------------------------

    const cf = crossfilter(data);
    const all = cf.groupAll();

    let dimension, group;

    // - picker which metric looking at
    // - ratio new cases/deaths
    // - smoothing
    // - search country

    function remove_empty(source_group) {
        return {
            all:function () {
                return source_group.all().filter(function(d) {
                    return d.value != 0;
                });
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

    window.totalCasesInTimeChart = new dc.LineChart('#totalCasesInTimeChart');

    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.tot_cases)

    totalCasesInTimeChart
        .dimension(dimension)
        .group(remove_empty(group));

    window.newCasesInTimeChart = new dc.BarChart('#newCasesInTimeChart');
    
    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.cases)

    newCasesInTimeChart
        .dimension(dimension)
        .group(remove_empty(group));

    window.totalDeathsInTimeChart = new dc.BarChart('#totalDeathsInTimeChart');

    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.tot_deaths)

    totalDeathsInTimeChart
        .dimension(dimension)
        .group(remove_empty(group))
        .colors(['red']);

    window.newDeathsInTimeChart = new dc.BarChart('#newDeathsInTimeChart');

    dimension = cf.dimension(d => d.date);
    group = dimension.group().reduceSum(d => d.deaths)

    newDeathsInTimeChart
        .dimension(dimension)
        .group(remove_empty(group))
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
            .elasticX(true)
            .elasticY(true)
            .transitionDuration(500)
            .margins({top: 0, right: 50, bottom: 40, left: 70})
            .renderHorizontalGridLines(true)
            .controlsUseVisibility(true);
    });

    let allCharts = [...evolutionCharts];
    allCharts.push(totalCasesByCountryChart);

    allCharts.forEach((chart) => {
        chart.renderlet(function(chart){
            let tickSelector = "g.tick text";
            if (evolutionCharts.includes(chart)) {
                tickSelector = "g.x text";
            }

            chart
                .selectAll(tickSelector)
                .attr('transform', "rotate(-65) translate(-25 -10)");
        });
    });
    // evolutionCharts.forEach((chart) => {
    //     chart.on('filtered', function(filteredChart) {
    //         let d = cf.dimension(d => d.date);
    //         let g = d.group().reduceSum(d => d.cases);
    //         let vals = g.all().filter((o) => o.value > 0);
        
    //         let newMinDate = Math.min(...vals.map((o) => o.key));
    //         let newMaxDate = Math.max(...vals.map((o) => o.key));

    //         evolutionCharts.forEach((otherChart) => {
    //             if (otherChart === filteredChart) {
    //                 return;
    //             }

    //             otherChart.x(d3.scaleTime().domain([newMinDate, newMaxDate]))
    //             otherChart.filters()
    //             // otherChart.(null)
    //             // console.log(extent)
    //             // otherChart.brush().extent(extent)
    //             // debugger;
    //             // console.log(otherChart.brush())
    //         });
    //     });
    // });

    
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
})