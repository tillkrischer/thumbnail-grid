FROM ubuntu

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get install -y ca-certificates curl gnupg cron ffmpeg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update
RUN apt-get install -y nodejs

COPY package*.json ./
RUN npm install

COPY src ./src
COPY run.sh ./

CMD bash run.sh