import sys
import os
import common
sys.path.append(common.get_root())

import procdata
import datetime as dt

today = dt.datetime.today().strftime('%Y-%m-%d')
df = procdata.get_final_df()

bck_dir = f'{common.get_root()}/data/bck'
os.makedirs(bck_dir, exist_ok=True)
df.to_csv(f'{bck_dir}/{today}.csv')
df.to_csv(f'{common.get_root()}/backend/bck_data.csv')