import streamlit as st
import pandas as pd
import numpy as np
import sys
import time
from common import *

sys.path.append(get_root())

import backend.procdata as procdata

st.title('Coronavirus vis')

@st.cache
def load_data():
    df = procdata.get_covid_df()
    return df

data_load_state = st.text('Loading data...')
df = load_data()
data_load_state.text('Loading data done!')

st.subheader('Coronavirus changes')

dates = sorted(df['date'].unique())

progress_bar = st.progress(0)
status_text = st.empty()
chart = st.bar_chart()

for i, d in enumerate(dates):
    progress_bar.progress(i/len(dates))
    status_text.text(d)

    data = df[df['date'] == d].set_index('country')['tot_cases']

    chart.add_rows(data)

    time.sleep(0.1)

status_text.text('Done!')
st.balloons()

