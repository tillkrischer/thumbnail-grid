FROM ubuntu

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get -y install cron curl ffmpeg

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash 
RUN apt-get update
RUN apt-get -y install nodejs

COPY package*.json ./
COPY src/ ./

RUN npm install

CMD bash run.sh