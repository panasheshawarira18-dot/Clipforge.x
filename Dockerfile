FROM node:20-bookworm

RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install --break-system-packages yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./
COPY index.html ./
COPY app.js ./
COPY style.css ./

RUN mkdir -p public && \
    cp index.html public/index.html && \
    cp app.js public/app.js && \
    cp style.css public/style.css

EXPOSE 3000

CMD ["node", "server.js"]
