from flask import Flask, render_template
import backend.procdata as procdata
import atexit
import threading
import time

current_df = None
current_df_lock = threading.Lock()
update_thread = threading.Thread()

SLEEP_TIME_SEC = 60*60

def create_app():
    app = Flask(__name__, template_folder='frontend/dist', static_folder='frontend/dist')

    def update_df():
        global current_df

        print('updating DF')

        df = procdata.get_final_df()

        with current_df_lock:
            current_df = df

        print(f'updated DF')

        schedule_next_update(SLEEP_TIME_SEC)

    def schedule_next_update(time_sec=SLEEP_TIME_SEC):
        print(f'sleeping {time_sec} min')
        global update_thread
        update_thread = threading.Timer(time_sec, update_df, ())
        update_thread.start()

    @app.route('/data')
    def get_data():
        while True:
            with current_df_lock:
                if current_df is not None:
                    break

            print('Data not ready yet')
            time.sleep(1)

        with current_df_lock:
            return current_df.to_csv()

    @app.route('/')
    def main():
        return render_template('index.html')

    schedule_next_update(0)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run()

