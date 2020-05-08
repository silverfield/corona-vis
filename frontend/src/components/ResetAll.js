export function ResetAll({
    resetAllCharts
}) {
    return <div className="reset-all-div">
        <a className='reset-all' onClick={resetAllCharts}>
            Reset all charts
        </a>
    </div>
}
