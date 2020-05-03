import DataProvider, { useData } from './../contexts/DataProvider'

export function Error({

}) {
    const {error} = useData();

    return <div id='error-msg' hidden={error === null}>
        {error}
    </div>
}