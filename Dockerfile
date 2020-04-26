# build frontend

FROM ubuntu:19.10 AS frontend_build
WORKDIR /src

RUN apt-get update && apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - 
RUN apt-get -y install nodejs make build-essential

COPY ./package.json ./
COPY ./package-lock.json ./
COPY ./webpack.config.js ./
RUN npm install

COPY ./frontend ./frontend
RUN ls -al .
RUN ./node_modules/.bin/webpack

# main stage

FROM ubuntu:19.10 AS main
WORKDIR /src

RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

COPY ./requirements.txt ./requirements.txt

RUN pip3 install -r requirements.txt

COPY ./ ./

COPY --from=frontend_build /src/ ./from_frontend
RUN cp -r from_frontend/* ./
RUN rm -rf from_frontend
RUN ls -al .

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

EXPOSE 8080

ENTRYPOINT [ "flask" ]
CMD [ "run", "--port", "5000", "--host", "0.0.0.0" ]



