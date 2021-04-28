import pandas as pd
import urllib.request
import traceback
from backend.common import *

DATA_PATH = f'{get_root()}/data/world.xlsx'


def consolidate_country_col(df, country_col, country_id_col, covid_df):
    """
    This method adjusts the values in the country field of the passed DF
    so that the values are matching those in the covid_DF whenever possible,
    so that we can subsequently join them on the country field.    
    """ 
    
    covid_countries = covid_df[['country_id', 'country']].drop_duplicates()
    covid_countries['country_lower'] = covid_countries['country'].str.lower()
    covid_countries['country_id_lower'] = covid_countries['country_id'].str.lower()
    
    df = df.rename(columns={
        country_col: 'country_other',
        country_id_col: 'country_id_other',
    })
    df['country_other_lower'] = df['country_other'].str.lower()
    df['country_id_other_lower'] = df['country_id_other'].str.lower()
    
    
    def _take_first_non_null_col(_df, _cols):
        return _df[_cols].fillna(method='bfill', axis=1).iloc[:, 0]
    
    def _consolidate_on(_df, col):
        _join_df = covid_countries.set_index(f'{col}_lower')
        _df = _df.join(_join_df, on=f'{col}_other_lower')
        _df['country_other'] = _take_first_non_null_col(_df, ['country', 'country_other'])
        for c in _join_df.columns:
            del _df[c]
            
        return _df
            
    df = _consolidate_on(df, 'country_id')
    df = _consolidate_on(df, 'country')
    
    df = df[df['country_other'].isin(covid_countries['country'])]
    
    del df['country_id_other']
    del df['country_other_lower']
    del df['country_id_other_lower']
    df = df.rename(columns={
        'country_other': 'country'
    })
    
    return df    


def get_google_mobility_df(covid_df):
    url = 'https://www.gstatic.com/covid19/mobility/Global_Mobility_Report.csv'
    
    df = pd.read_csv(url, nrows=1)
    dtypes = {col: 'float' if col.endswith('baseline') else 'object' for col in df.columns}

    df = pd.read_csv(url, dtype=dtypes)

    del df['iso_3166_2_code']
    del df['census_fips_code']

    df = consolidate_country_col(df, 'country_region', 'country_region_code', covid_df)

    df = df[pd.isna(df['sub_region_1'])]
    del df['sub_region_1']
    del df['sub_region_2']

    to_rep = '_percent_change_from_baseline'
    for col in df.columns:
        if col.endswith(to_rep):
            df = df.rename(columns={col: 'pc_' + col.replace(to_rep, '')})

    df = df[pd.isnull(df['metro_area'])]
    del df['metro_area']

    return df


def get_covid_df():
    # get the data
    url = 'https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide.xlsx'
    df = pd.read_excel(url)

    # basic processing

    df = df.rename(columns={
        'dateRep': 'date',
        'countriesAndTerritories': 'country',
        'popData2019': 'population',
        'geoId': 'country_id',
        'continentExp': 'continent'
    })
    del df['countryterritoryCode']

    df.loc[df['country'] == 'Namibia', 'country_id'] = 'NAMIBIA'

    df.loc[df['country'] == 'Czechia', 'population'] = 10650000
    df['population'] = df['population'].fillna(0)

    df['country'] = df['country'].str.replace('_', ' ')

    if df['date'].dtype.name == 'object':
        df['date'] = pd.to_datetime(df['date'], format="%d/%m/%Y")
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')    

    # add new columns - totals

    def _apply(g):
        g = g.sort_values(by='date', ascending=False)
        
        g['tot_deaths'] = g['deaths'][::-1].cumsum()[::-1]
        g['tot_cases'] = g['cases'][::-1].cumsum()[::-1]
        
        return g

    df = df.groupby('country').apply(_apply)

    df['cases'] = df['cases'].apply(lambda x: max(0, x))
    df['deaths'] = df['deaths'].apply(lambda x: max(0, x))

    df.index = range(len(df))

    # check all fields are filled
    df = df.dropna()
    assert all(df.count()['date'] == x for x in df.count())

    return df


def get_stringency_df(covid_df):
    df = pd.read_csv('https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/OxCGRT_latest.csv')

    df['CountryCode'] = df['CountryCode'].replace({
        'SVK': 'SK',
        'CZE': 'CZ',
        'USA': 'US'
    })

    df = consolidate_country_col(df, 'CountryName', 'CountryCode', covid_df)

    df['Date'] = df['Date'].astype('str').apply(lambda x: f'{x[:4]}-{x[4:6]}-{x[6:]}')

    for c in [
        'LegacyStringencyIndex',
        'LegacyStringencyIndexForDisplay',
        'ConfirmedCases',
        'ConfirmedDeaths'
    ]:
        if c in df.columns:
            del df[c]
        
    df = df.rename(columns={
        'StringencyIndex': 'stringency',
        'StringencyIndexForDisplay': 'stringency_disp'
    })

    df.columns = [c.lower() for c in df.columns]

    for letter in ['c', 'e', 'h', 'm']:
        for i in range(1, 100):
            cols = [c for c in df.columns if f'{letter}{i}_' in c]
            if len(cols) == 0:
                continue
                
            name = '_'.join(cols[0].split('_')[1].split(' '))
            name_flag = f'{name}_flag'
            name_notes = f'{name}_note'
            
            new_names = [f'mtr_{letter}_{c}' for c in [name, name_flag, name_notes]]
            
            df = df.rename(columns={
                cols[i]: new_names[i] for i in range(len(cols))
            })
    
    df['stringency'] = df['stringency']/100
    df['stringency_disp'] = df['stringency_disp']/100

    return df


def _get_final_df():
    covid_df = get_covid_df()

    df = covid_df

    gm_df = get_google_mobility_df(covid_df)
    df = df.join(gm_df.set_index(['country', 'date']), on=['country', 'date'])

    str_df = get_stringency_df(covid_df)
    df = df.join(str_df.set_index(['country', 'date']), on=['country', 'date'])

    cols_to_drop = [
        'day', 'month', 'year', 
        'country_id',
        'stringency_disp'
    ]
    cols_to_drop.extend([c for c in df.columns if 'mtr_' in c and 'mtr_c' not in c])
    cols_to_drop.extend([c for c in df.columns if '_note' in c or '_flag' in c])

    for c in set(cols_to_drop):
        del df[c]


    mtr_cols = [c for c in df.columns if c.startswith('mtr_c')]
    df[mtr_cols] = df[mtr_cols]/df[mtr_cols].max()

    return df


def get_final_df(load_ok=None):
    # try:
    #     df = _get_final_df()
    #     if type(load_ok) == list:
    #         load_ok.append(True)
    #
    #
    #     cols = [
    #         'date',
    #         'cases',
    #         'deaths',
    #         'country',
    #         'continent',
    #         'population',
    #         'tot_deaths',
    #         'tot_cases',
    #         'pc_retail_and_recreation',
    #         'pc_grocery_and_pharmacy',
    #         'pc_parks',
    #         'pc_transit_stations',
    #         'pc_workplaces',
    #         'pc_residential',
    #         'mtr_c_school_closing',
    #         'mtr_c_workplace_closing',
    #         'mtr_c_cancel_public_events',
    #         'mtr_c_restrictions_on_gatherings',
    #         'mtr_c_close_public_transport',
    #         'mtr_c_stay_at_home_requirements',
    #         'mtr_c_restrictions_on_internal_movement',
    #         'mtr_c_international_travel_controls',
    #         'stringency',
    #     ]
    #     return df[cols]
    # except Exception as e:
    #     traceback.print_exc()
    #     print(f'Exception getting the data: {e}')
    
    print('Using backup')
    if type(load_ok) == list:
        load_ok.append(False)
    return pd.read_csv(f'{get_root()}/backend/bck_data.csv', index_col=0)