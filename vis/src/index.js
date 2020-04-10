'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';


d3.csv('data.csv').then(data => {
    const totalCasesByCountryChart = new dc.RowChart('#totalCasesByCountry');
    const totalCasesInTimeChart = new dc.LineChart('#totalCasesInTime');

    // prep data ----------------------------------------

    const dateFormatParser = d3.timeParse('%Y-%m-%d');

    data.forEach(d => {
        d.date = dateFormatParser(d.date);
    });
    // debugger;

    // prep the cross filters ----------------------------------------

    const mainNdx = crossfilter(data);
    const all = mainNdx.groupAll();

    const countryDimension = mainNdx.dimension(d => d.country);
    const dateDimension = mainNdx.dimension(d => d.date);

    const countryTotals = countryDimension.group().reduceSum(d => d.cases);

    const dateTotals = dateDimension.group().reduceSum(d => d.cases)

    // const indexAvgByMonthGroup = moveMonths.group().reduce(
    //     (p, v) => {
    //         ++p.days;
    //         p.total += (v.open + v.close) / 2;
    //         p.avg = Math.round(p.total / p.days);
    //         return p;
    //     },
    //     (p, v) => {
    //         --p.days;
    //         p.total -= (v.open + v.close) / 2;
    //         p.avg = p.days ? Math.round(p.total / p.days) : 0;
    //         return p;
    //     },
    //     () => ({days: 0, total: 0, avg: 0})
    // );

    
    console.log(countryTotals.all());
    console.log(countryDimension);
    // debugger;

    // charts ----------------------------------------

    totalCasesByCountryChart
        .turnOnControls(true)
        .controlsUseVisibility(true)
        .width(600)
        .height(400)
        .transitionDuration(500)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(countryTotals)
        .dimension(countryDimension)
        .elasticX(true)
        .cap(10)
        .label(d => d.key)
        .title(d => d.value);


    let minDate = Math.min(...data.map((d) => d.date));
    let maxDate = Math.max(...data.map((d) => d.date));
    totalCasesInTimeChart
        .turnOnControls(true)
        .controlsUseVisibility(true)
        .curve(d3.curveLinear)
        .width(990)
        .height(200)
        .transitionDuration(500)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .dimension(dateDimension)
        .mouseZoomable(true)
        // .rangeChart(volumeChart)
        .x(d3.scaleTime().domain([minDate, maxDate]))
        // .round(d3.timeMonth.round)
        .xUnits(d3.timeMonths)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .group(dateTotals)


    dc.renderAll();
})