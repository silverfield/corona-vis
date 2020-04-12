'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';
import './css/styles.scss';

window.dc = dc;

d3.csv('data.csv').then(data => {
    window.totalCasesByCountryChart = new dc.RowChart('#totalCasesByCountryChart');
    window.totalCasesInTimeChart = new dc.LineChart('#totalCasesInTimeChart');
    window.newCasesInTimeChart = new dc.LineChart('#newCasesInTimeChart');
    window.testChart = new dc.LineChart('#testChart');

    // prep data ----------------------------------------

    const dateFormatParser = d3.timeParse('%Y-%m-%d');

    data.forEach(d => {
        d.date = dateFormatParser(d.date);
    });

    // prep the cross filters ----------------------------------------

    const mainNdx = crossfilter(data);
    const all = mainNdx.groupAll();

    const countryDimension = mainNdx.dimension(d => d.country);
    const dateDimension = mainNdx.dimension(d => d.date);

    const totalCasesByCountry = countryDimension.group().reduceSum(d => d.cases);

    const totalCasesInTime = dateDimension.group().reduceSum(d => d.tot_cases)
    const newCasesInTime = dateDimension.group().reduceSum(d => d.cases)

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

    
    console.log(totalCasesByCountry.all());
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
        .group(totalCasesByCountry)
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
        .renderHorizontalGridLines(true)
        .width(790)
        .height(200)
        .brushOn(false)
        .transitionDuration(500)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .x(d3.scaleTime().domain([minDate, maxDate]))
        .elasticY(true)
        .legend(new dc.Legend().x(800).y(10).itemHeight(13).gap(5))
        .dimension(dateDimension)
        .group(totalCasesInTime)
        .curve(d3.curveLinear)
        .rangeChart(testChart)

    newCasesInTimeChart
        .turnOnControls(true)
        .controlsUseVisibility(true)
        .renderHorizontalGridLines(true)
        .width(790)
        .height(200)
        .brushOn(false)
        .transitionDuration(500)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .x(d3.scaleTime().domain([minDate, maxDate]))
        .elasticY(true)
        .legend(new dc.Legend().x(800).y(10).itemHeight(13).gap(5))
        .dimension(dateDimension)
        .group(newCasesInTime)
        .curve(d3.curveLinear)
        // .rangeChart(testChart)

    testChart
        .turnOnControls(true)
        .controlsUseVisibility(true)
        .renderHorizontalGridLines(true)
        .width(790)
        .height(100)
        .transitionDuration(500)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .x(d3.scaleTime().domain([minDate, maxDate]))
        .elasticY(true)
        .legend(new dc.Legend().x(800).y(10).itemHeight(13).gap(5))
        .dimension(dateDimension)
        .group(newCasesInTime)
        .curve(d3.curveLinear)
        
        
        
        


    dc.renderAll();
})