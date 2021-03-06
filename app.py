from flask import Flask, render_template
import backend.procdata as procdata
from flask import request
import atexit
import threading
import time
import requests
import os

current_df = None
loaded_ok = True
current_df_lock = threading.Lock()
update_thread = threading.Thread()
ping_thread = threading.Thread()

UPDATE_TIME_SEC = 60*60
PING_TIME_SEC = 20*60

def create_app():
    app = Flask(__name__, template_folder='frontend/dist', static_folder='frontend/dist')

    def update_df():
        global current_df
        global loaded_ok

        print('updating DF')

        load_ok = []
        df = procdata.get_final_df(load_ok)
        loaded_ok = load_ok[0]

        with current_df_lock:
            current_df = df

        print(f'updated DF')
        try:
            os.system('ps -o pid,user,vsz,rss,command ax | grep gunicorn')
        except:
            pass

        schedule_next_update(UPDATE_TIME_SEC)

    def schedule_next_update(time_sec=UPDATE_TIME_SEC):
        print(f'Update thread: sleeping {time_sec} sec')
        global update_thread
        update_thread = threading.Timer(time_sec, update_df, ())
        update_thread.start()

    def ping():
        print('pinging...')
        try:
            res = requests.get(f'https://corona-vis-prod.herokuapp.com/ping')
            print(res)
        except Exception as e:
            print('Error pinging')
            print(e)
        schedule_next_ping()

    def schedule_next_ping(time_sec=PING_TIME_SEC):
        print(f'Ping thread: sleeping {time_sec} sec')
        global ping_thread
        ping_thread = threading.Timer(time_sec, ping, ())
        ping_thread.start()

    def wait_for_data():
        while True:
            with current_df_lock:
                if current_df is not None:
                    break

            print('Data not ready yet')
            time.sleep(1)

    @app.after_request
    def add_header(r):
        r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        r.headers["Pragma"] = "no-cache"
        r.headers["Expires"] = "0"
        r.headers['Cache-Control'] = 'public, max-age=0'
        return r

    @app.route('/countries')
    def get_countries():
        wait_for_data()

        with current_df_lock:
            return {
                'countries': list(current_df['country'].unique())
            }

    @app.route('/max-dates')
    def get_max_dates():
        wait_for_data()

        with current_df_lock:
            pc_cols = [c for c in current_df if c.startswith('pc_')]
            return {
                'ecdc': current_df['date'].max(),
                'gmob': current_df.dropna(subset=pc_cols)['date'].max(),
                'oxford': current_df.dropna(subset=['stringency'])['date'].max()
            }

    @app.route('/loaded-ok')
    def loaded_ok_route():
        wait_for_data()

        return {'loaded_ok': loaded_ok}

    @app.route('/data')
    def get_data():
        wait_for_data()

        with current_df_lock:
            df = current_df.copy()

        search_country = request.args.get('search-country').lower().strip()
        if search_country:
            df = df[df['country'].str.lower().str.contains(search_country)]

        return df.to_json(orient="records")

    @app.route('/one-country')
    def get_compare():
        wait_for_data()

        with current_df_lock:
            df = current_df.copy()

        res = {}

        country = request.args.get('country').strip()
        if country not in df['country'].unique():
            return {
                'error': f'Country {country} not found'
            }
        d = df[df['country'] == country]

        return d.to_json(orient="records")

    @app.route('/')
    def main():
        return render_template('index.html')

    @app.route('/ping')
    def route_ping():
        print('...pinged')
        return {'ping': 'ok'}

    schedule_next_update(0)
    schedule_next_ping(0)
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=False, threaded=True)

