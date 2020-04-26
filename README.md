# corona-vis

Live site on [https://corona-vis-prod.herokuapp.com/](https://corona-vis-prod.herokuapp.com/)

# dev

Install 

* `pip install -r requirements.txt`
* `npm install`

Run: 

* `FLASK_APP=app.py FLASK_ENV=development flask run`
* `npm run both`

Deploy:

One off:
* heroku app `corona-vis-prod`
* `heroku buildpacks:set heroku/python --app corona-vis-prod`
* `heroku buildpacks:add --index 1 heroku/nodejs --app corona-vis-prod`
* `git push heroku master`

https://realpython.com/flask-by-example-part-1-project-setup/ 


Docker

* `docker image build --target frontend -t corona-frontend .`
* `docker image build --target main -t corona-main .`