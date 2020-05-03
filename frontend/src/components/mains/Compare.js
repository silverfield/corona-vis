export default function Compare({

}) {
    return <>
        <form className="controls" autoComplete="false">
            <div className="main-controls">
                <div className="control">
                    <label htmlFor="country-1">Country 1:</label>
                    <div className="autocomplete" style={{'width': '300px'}}>
                        <input 
                            type="text" 
                            id="country-1" 
                            defaultValue="United Kingdom"
                            autoComplete="off"
                        />
                    </div>
                    <input id="clear-country-1" type="button" value="clear" readOnly={true}/>
                </div>
                <div className="control">
                    <label htmlFor="country-2">Country 2:</label>
                    <div className="autocomplete" style={{'width': '300px'}}>
                        <input 
                            type="text" 
                            id="country-2" 
                            defaultValue="Germany"
                            autoComplete="off"
                        />
                    </div>
                    <input id="clear-country-2" type="button" value="clear" readOnly={true}/>
                </div>
            </div>

            <div className="submit">
                <input type="submit" />
            </div>
        </form>
    </>
}