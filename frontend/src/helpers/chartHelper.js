import * as dc from 'dc';

export function ResetButton({
    chart
}) {
    return <a 
        className='reset'
        onClick={() => resetChart(chart, true)}
    >
        (reset)
    </a>
}

export function resetChart(chart, redraw) {
    chart.filterAll();

    if (redraw !== false) {
        dc.redrawAll();
    }
};

export function rotateTicks(chart, onlyX) {
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

export function removeEmpty(sourceGroup) {
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

export function enableLegendToggle(chart, defaultOn, groupToogleFunc) {
    if (groupToogleFunc === undefined) {
        groupToogleFunc = (i) => [i];
    }
    if (defaultOn === undefined) {
        defaultOn = true;
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
                let indexGroup = groupToogleFunc(i);

                indexGroup.forEach(j => {
                    var subchart = chart.select('g.sub._' + j);
                    var visible = subchart.style('stroke-opacity') === '1';
                    subchart.style('stroke-opacity', function() {
                        return visible ? 0.1 : 1;
                    });
                });
          
                drawLegendToggles(chart);
            })
        drawLegendToggles(chart);
    }

    chart.on('pretransition.hideshow', legendToggle);
    chart.on('postRender', () => {
        chart
            .selectAll('g.dc-legend .dc-legend-item')
            .style('opacity', (d, i) => {
                var subchart = chart.select('g.sub._' + i);
                subchart.style('stroke-opacity', () => (defaultOn ? 1 : 0.1));
                return (defaultOn ? 1 : 0.5);
            });
    });
}

export function getAvgGroupFunctions(accessorFunc) {
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