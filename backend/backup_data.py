import sys
import common
sys.path.append(common.get_root())

import procdata
import datetime as dt

today = dt.datetime.today().strftime('%Y-%m-%d')
df = procdata.get_final_df()

df.to_csv(f'{common.get_root()}/data/{today}.csv')