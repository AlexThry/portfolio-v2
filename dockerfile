FROM nginx:alpine

COPY . /usr/share/nginx/html

RUN mv /usr/share/nginx/html/Portfolio.html /usr/share/nginx/html/index.html || true

EXPOSE 80