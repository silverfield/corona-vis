export function Loader({
    loading
}) {
    return <div id="loader-container" className="loader-container" hidden={!loading} >
        <div>
            <b>Loading the data, this may take a few seconds...</b>
            <div className="center-container">
                <div id="loader" className="loader"></div>
            </div>
        </div>      
    </div>
}