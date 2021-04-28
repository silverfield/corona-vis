# covid19-vis

Live site on [http://covid-vis.ferohajnovic.com/](http://covid-vis.ferohajnovic.com/)

To run locally, simply:
* make sure you have Docker installed
* Build the image: `docker image build -t corona-main .`
* Run the app: `docker run -it -p 5000:5000 corona-main`
* Go to `http://localhost:5000/` in your browser

### dev setup

Instructions are for Linux. Easiest recipe is to follow the instructions from the Dockerfile.

Install the required tools:

- Python3.7+
- Node.js 14

Install the dependencies

* `pip install -r requirements.txt`
* `npm install`

Run: 

* `FLASK_APP=app.py FLASK_ENV=development flask run`
* `npm run both`

### deploy

* [heroku setup](https://realpython.com/flask-by-example-part-1-project-setup/#heroku-command-line-interface-cli)
* heroku app -> `corona-vis-prod` (you'd need to create one for yourself)
* `heroku git:remote --app corona-vis-prod`
* `git push heroku master`

#### deploy setup

Buildpacks

* `heroku buildpacks:set heroku/python --app corona-vis-prod`
* `heroku buildpacks:add --index 1 heroku/nodejs --app corona-vis-prod`

https://realpython.com/flask-by-example-part-1-project-setup/ 

### docker

* make sure you have Docker installed
* Build the image: `docker image build -t corona-main .`
* Run the app: `docker run -it -p 5000:5000 corona-main`
* Go to `http://localhost:5000/` in your browser

When developing, might be better to split the Docker image build in two steps:
* `docker image build --target frontend -t corona-frontend .`
* `docker image build --target main -t corona-main .`
This would avoid the dangling images

### structure

Roughly, the solution is split into:

- backend (Flask web server, Pandas processing)
    - All Python based
    - Some Jupyter notebooks for testing code before putting it to scripts
- frontend (React web app including dc.js charts)