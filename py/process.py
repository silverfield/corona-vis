import pandas as pd
import urllib.request

import os

this_folder = os.path.dirname(__file__)
root_folder = os.path.realpath(f'{this_folder}/..')

DATA_PATH = f'{root_folder}/data/world.xlsx'


# get the data

url = 'https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide.xlsx'
urllib.request.urlretrieve(url, DATA_PATH)
df = pd.read_excel(DATA_PATH)

# process basic

df = df.rename(columns={
    'dateRep': 'date',
    'countriesAndTerritories': 'country',
    'popData2018': 'population'
})
del df['countryterritoryCode']

df.loc[df['country'] == 'Namibia', 'geoId'] = 'NAMIBIA'

df.loc[df['country'] == 'Czechia', 'population'] = 10650000
df['population'] = df['population'].fillna(0)

assert all(df.count()['date'] == x for x in df.count())

print(df.shape)
print(df.head())

# add new columns

def _apply(g):
    g = g.sort_values(by='date', ascending=False)
    
    g['tot_deaths'] = g['deaths'][::-1].cumsum()[::-1]
    g['tot_cases'] = g['cases'][::-1].cumsum()[::-1]
    
    return g

df = df.groupby('country').apply(_apply)
df.index = range(len(df))
print(df.head())

# save data

df.to_csv(f'{root_folder}/vis/src/data.csv')
df.to_csv(f'{root_folder}/data/data.csv')

