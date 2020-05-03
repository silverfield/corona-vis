import {createContext, useState, useContext} from "react"
import {dc} from "dc"

const ChartContext = createContext(null);

export function ChartProvider({
    children
}) {
    const [charts, setCharts] = useState([]);

    function addChart(chart) {
        let newCharts = charts.slice();
        newCharts.push(chart);

        setCharts(newCharts);
    };

    function resetAllCharts() {
        charts.forEach(c => resetChart(c, false));
        dc.redrawAll();
    };

    return <ChartContext.Provider value={{charts, addChart, resetAllCharts}}>
        {children}
    </ChartContext.Provider>
};

export const useCharts = () => useContext(ChartContext);

