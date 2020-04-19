import pandas as pd
import urllib.request
from backend.common import *

DATA_PATH = f'{get_root()}/data/world.xlsx'


def get_google_mobility_df(covid_df):
    url = 'https://www.gstatic.com/covid19/mobility/Global_Mobility_Report.csv'
    
    df = pd.read_csv(url, nrows=1)
    dtypes = {col: 'float' if col.endswith('baseline') else 'object' for col in df.columns}

    df = pd.read_csv(url, dtype=dtypes)

    covid_countries = covid_df[['country_id', 'country']].drop_duplicates()

    # we use country as written in Covid dataset whenever possible - the rest we drop
    df = df.join(covid_countries.set_index('country_id'), on='country_region_code')
    df['country_region'] = df[['country', 'country_region']].fillna(method='bfill', axis=1).iloc[:, 0]
    df = df[df['country'].isin(covid_countries['country'])]

    del df['country']
    del df['country_region_code']
    df = df[pd.isna(df['sub_region_1'])]
    del df['sub_region_1']
    del df['sub_region_2']

    df = df.rename(columns={'country_region': 'country'})

    return df


def get_covid_df():
    # get the data
    url = 'https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide.xlsx'
    df = pd.read_excel(url)

    # basic processing

    df = df.rename(columns={
        'dateRep': 'date',
        'countriesAndTerritories': 'country',
        'popData2018': 'population',
        'geoId': 'country_id'
    })
    del df['countryterritoryCode']

    df.loc[df['country'] == 'Namibia', 'country_id'] = 'NAMIBIA'

    df.loc[df['country'] == 'Czechia', 'population'] = 10650000
    df['population'] = df['population'].fillna(0)

    df['country'] = df['country'].str.replace('_', ' ')    
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')

    # add new columns - totals

    def _apply(g):
        g = g.sort_values(by='date', ascending=False)
        
        g['tot_deaths'] = g['deaths'][::-1].cumsum()[::-1]
        g['tot_cases'] = g['cases'][::-1].cumsum()[::-1]
        
        return g

    df = df.groupby('country').apply(_apply)
    df.index = range(len(df))

    # save data
    # df.to_csv(f'{get_root()}/vis/src/data.csv')
    # df.to_csv(f'{get_root()}/data/data.csv')

    # check all fields are filled
    assert all(df.count()['date'] == x for x in df.count())

    return df


def get_final_df():
    covid_df = get_covid_df()

    gm_df = get_google_mobility_df(covid_df)

    df = covid_df.join(gm_df.set_index(['country', 'date']), on=['country', 'date'])

    return df