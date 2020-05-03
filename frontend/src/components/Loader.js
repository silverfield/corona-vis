import { useData } from './../contexts/DataProvider'

export function Loader({

}) {
    const {loading} = useData();

    return <div id="loader-container" className="loader-container" hidden={!loading} >
        <div>
            <b>Loading the data, this may take a few seconds...</b>
            <div className="center-container">
                <div id="loader" className="loader"></div>
            </div>
        </div>      
    </div>
}