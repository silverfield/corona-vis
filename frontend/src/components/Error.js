export function Error({
    error
}) {
    return <div id='error-msg' hidden={error === null}>
        {error}
    </div>
}