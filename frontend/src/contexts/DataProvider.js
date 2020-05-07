import {resetChart} from '../helpers/chartHelper'
import {createContext, useState, useContext} from "react"
import * as d3 from "d3";
import * as dc from "dc";
import * as crossfilter from 'crossfilter';

const DataContext = createContext(null);

export function DataProvider({
    children
}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);
    const [charts, setCharts] = useState([]);
    const [cf, setCf] = useState(null);

    function addChart(chart) {
        setCharts(prevCharts => [...prevCharts, chart]);
    };

    function resetAllCharts() {
        charts.forEach(c => resetChart(c, false));
        dc.redrawAll();
    };

    const loadData = (loadFunction) => {
        setLoading(true);
        dc.chartRegistry.clear();
        setCharts([]);

        loadFunction((resData) => {
            setData(resData);

            setLoading(false);
            dc.renderAll();
        });
    };

    const loadWorld = (searchCountry) => {
        const _loadFunc = (callBack) => {
            let request = `/data?search-country=${searchCountry}`;

            d3.csv(request).then(resData => {
                const dateFormatParser = d3.timeParse('%Y-%m-%d');
        
                resData.forEach(d => {
                    d.date = dateFormatParser(d.date);
                });

                let newCf = crossfilter(resData);
                setCf(newCf);

                let newMeta = {
                    'minDate': Math.min(...resData.map((d) => d.date)),
                    'maxDate': Math.max(...resData.map((d) => d.date))
                };
                setMeta(newMeta);
        
                callBack(resData);
            });
        };

        loadData(_loadFunc);
    };

    return <DataContext.Provider value={{
        data, 
        loading, 
        loadWorld, 
        error, 
        meta, 
        charts, 
        addChart,
        resetAllCharts,
        cf
    }}>
        {children}
    </DataContext.Provider>
};

export const useData = () => useContext(DataContext);

