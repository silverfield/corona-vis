# build frontend

FROM ubuntu:19.10 AS frontend_build
WORKDIR /src

RUN apt-get update
RUN apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get -y install nodejs
RUN apt-get -y install make build-essential

COPY ./package.json /src/
COPY ./package-lock.json /src/
COPY ./webpack.config.js /src/
RUN npm install

COPY ./frontend /src/
RUN ./node_modules/.bin/webpack

# main stage

FROM ubuntu:19.10 AS main
WORKDIR /src

RUN apt-get update
RUN apt-get install -y python-pip

COPY . /src
COPY --from=frontend_build /src/* /src/

RUN pip install -r requirements.txt

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

EXPOSE 8080

ENTRYPOINT [ "flask", "run" "--port", "8090" ]



