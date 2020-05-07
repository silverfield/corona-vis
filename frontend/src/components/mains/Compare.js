export default function Compare({

}) {
    const loadData = () => {
        let country1 = $('#country-1').val();
        let country2 = $('#country-2').val();
        let countries = [country1, country2];
        let requests = countries.map(c => `/one-country?country=${c}`);

        let promises = requests.map(r => d3.csv(r));

        Promise.all(promises).then(function(results) {
            let errored = results.map(r => {
                if (r['error']) {
                    $('#loader-container').hide();
                    $('#content').show();
                    $('#error-msg').text(result['error']);
                    return true;
                }

                return false;
            })

            if (errored.some(e => e === true)) {
                return;
            }
            
            glData = {
                [countries[0]]: results[0],
                [countries[1]]: results[1]
            }

            const dateFormatParser = d3.timeParse('%Y-%m-%d');

            countries.forEach(country => {
                glData[country].forEach(d => {
                    d.date = dateFormatParser(d.date);
                });
            });
    
            redrawCompareMode();
        }).catch(function(err) {

        })
    };

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