'use strict';

import * as d3 from "d3";
import * as dc from 'dc';
import * as crossfilter from 'crossfilter';


d3.csv('data.csv').then(data => {
    const totalsBarChart = new dc.RowChart('#totals-bar');
    // const evolutionLineChart = new dc.LineChart('#evolution-line');

    // prep data ----------------------------------------

    const dateFormatParser = d3.timeParse('%Y-%m-%d');

    data.forEach(d => {
        d.date = dateFormatParser(d.date);
    });

    // prep the cross filters ----------------------------------------

    const ndx = crossfilter(data);
    const all = ndx.groupAll();

    const countryDimension = ndx.dimension(d => d.country);
    const dateDimension = ndx.dimension(d => d.date);

    const countryTotals = countryDimension.group().reduceSum(d => d.cases);
    console.log(countryTotals.all());

    // charts ----------------------------------------

    totalsBarChart
        .width(600)
        .height(8000)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(countryTotals)
        .dimension(countryDimension)
        .elasticX(true)
        // .label(d => d.key)
        // .title(d => d.value);


    dc.renderAll();
})