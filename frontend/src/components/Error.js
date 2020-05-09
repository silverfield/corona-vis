export function Error({
    error
}) {
    return <div className='error-msg' hidden={error === null}>
        {error}
    </div>
}