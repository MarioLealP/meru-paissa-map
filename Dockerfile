# Static site, no backend: the browser reads PaissaDB directly (it sends CORS *).
FROM nginx:1.30.6-alpine

COPY site/ /usr/share/nginx/html/
