from flask import Flask, render_template
import procdata
app = Flask(__name__, template_folder='frontend/dist', static_folder='frontend/dist')


@app.route('/data')
def get_data():
    df = procdata.get_proc_data()
    return df.to_csv()

@app.route('/')
def main():
    return render_template('index.html')

if __name__ == '__main__':
    app.run()
