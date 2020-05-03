import * as dc from 'dc';

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