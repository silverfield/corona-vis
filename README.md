# corona-vis

Go to [the site](vis/publish)

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


* `git push heroku master`

https://realpython.com/flask-by-example-part-1-project-setup/ 