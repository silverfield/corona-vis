import {resetChart} from '../helpers/chartHelper'
import {createContext, useState, useContext} from "react"
import * as dc from "dc";

export function dataProvider() {
    const [data, setData] = useState(null);
    const [cf, setCf] = useState(null);
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);
    
    const [countryCfs, setCountryCfs] = useState(null);
    const [countryMetas, setCountryMetas] = useState(null);

    function addChart(chart) {
        setCharts(prevCharts => [...prevCharts, chart]);
    };

    function resetAllCharts() {
        charts.forEach(c => resetChart(c, false));
        dc.redrawAll();
    };

    const loadData = (loadFunction) => {
        setLoading(true);
        setError(null);
        charts.forEach((c) => {
            dc.chartRegistry.deregister(c);
        })
        setCharts([]);

        loadFunction((resData) => {
            setData(resData);

            if (resData !== null) {
                dc.renderAll();

                setLoading(false);
            }
        });
    };

    return {
        data, 
        loading, 
        loadData, 
        error, 
        setError,
        meta,
        setMeta,
        setCf,
        charts, 
        addChart,
        resetAllCharts,
        cf,
        countryCfs,
        setCountryCfs,
        countryMetas,
        setCountryMetas
    }
};
