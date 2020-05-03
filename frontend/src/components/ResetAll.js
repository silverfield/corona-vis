import { useData } from './../contexts/DataProvider'

export function ResetAll({

}) {
    const {resetAllCharts} = useData();

    return <div className="reset-all-div">
        <a className='reset-all' onClick={resetAllCharts}>
            Reset all charts
        </a>
    </div>
}
