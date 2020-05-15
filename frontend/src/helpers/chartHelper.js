import * as dc from 'dc';

export const countryColors = ['#0074D9', '#85144b']

export function ResetButton({
    chart
}) {
    const reset = () => {
        Array.isArray(chart) ? chart.forEach(c => resetChart(c, true)) : resetChart(chart, true)
    }

    return <a 
        className='reset'
        onClick={() => reset()}
    >
        (reset)
    </a>
}

export function randomId() {
    return 'a' + Math.random().toString(36).substr(2, 9);
};

export function resetChart(chart, redraw) {
    chart.filterAll();

    if (redraw !== false) {
        dc.redrawAll();
    }
};

export function rotateTicks(chart, onlyX, rotate, trX, trY) {
    if (rotate === undefined) rotate = -65;
    if (trX === undefined) trX = -25;
    if (trY === undefined) trY = -10;

    chart.on('renderlet', function(_chart) {
        let tickSelector = "g.tick text";

        if (onlyX) {
            tickSelector = "g.x text";
        }

        _chart
            .selectAll(tickSelector)
            .attr('transform', `rotate(${rotate}) translate(${trX} ${trY})`);
    });
}

export function avgCalc(value) {
    return value.count > 0 ? value.total / value.count : null;
}

export function logScale(sourceGroup, isLogScale) {
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

export function popScale(sourceGroup, isScalePop, population) {
    return {
        all: function() {
            if (isScalePop()) {
                return sourceGroup.all().map(i => {
                    return {
                        key: i.key,
                        value: i.value/population
                    }
                });
            }
            
            return sourceGroup.all();
        }
    }
}

export function removeEmpty(sourceGroup) {
    return {
        all:function () {
            let filtered = sourceGroup.all().filter(function(i) {
                if (i.value.count !== undefined) {
                    return avgCalc(i.value) !== null;
                }
                return i.value != 0;
            });

            return filtered;
        }
    };
}

export function enableLegendToggle(chart, defaultOn, groupToogleFunc) {
    if (groupToogleFunc === undefined) {
        groupToogleFunc = (i) => [i];
    }
    if (defaultOn === undefined) {
        defaultOn = true;
    }

    var hiddenOpacity = 0.15;

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
                let indexGroup = groupToogleFunc(i);

                indexGroup.forEach(j => {
                    var subchart = chart.select('g.sub._' + j);
                    var visible = subchart.style('stroke-opacity') === '1';
                    subchart.style('stroke-opacity', function() {
                        return visible ? hiddenOpacity : 1;
                    });
                });
          
                drawLegendToggles(chart);
            })
            .on('mouseover', function (d, i) {
                let indexGroup = groupToogleFunc(i);

                indexGroup.forEach(j => {
                    var subchart = chart.select('g.sub._' + j);
                    subchart.select('.line').style('stroke-width', 5);
                    subchart.select('.line').style('stroke-opacity', 1);
                });
            })
            .on('mouseout', function (d, i) {
                let indexGroup = groupToogleFunc(i);

                indexGroup.forEach(j => {
                    var subchart = chart.select('g.sub._' + j);
                    var visible = subchart.style('stroke-opacity') === '1';
                    subchart.select('.line').style('stroke-width', 3);
                    subchart.select('.line').style('stroke-opacity', visible ? 1 : hiddenOpacity);
                });
            })
        drawLegendToggles(chart);
    }

    chart.on('pretransition.hideshow', legendToggle);
    chart.on('postRender', () => {
        chart
            .selectAll('g.dc-legend .dc-legend-item')
            .style('opacity', (d, i) => {
                var subchart = chart.select('g.sub._' + i);
                subchart.select('.line').style('stroke-width', 3);
                subchart.style('stroke-opacity', () => (defaultOn ? 1 : hiddenOpacity));
                return (defaultOn ? 1 : 0.5);
            });
    });
}

export function getAvgGroupFunctions(accessorFunc) {
    function reduceAdd(p, v) {
        if (accessorFunc(v) !== null) {
            ++p.count;
            if (p.total === null) {
                p.total = 0;
            }
            p.total += Number(accessorFunc(v));
        }
        return p;
    }
    
    function reduceRemove(p, v) {
        if (accessorFunc(v) !== null) {
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