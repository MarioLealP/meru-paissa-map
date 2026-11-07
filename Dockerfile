# A static site as a Meru app: site/ served by unprivileged nginx on 8080 with this repo's nginx.conf. The base is
# pinned to a digest (CI refuses anything else); an upgrade is a PR that changes it.
FROM docker.io/nginxinc/nginx-unprivileged:1.30.6-alpine-slim@sha256:5d8bb9437d74a600ec5dbf90c035451c724dc33eac8d3a71078f6f8612c345f6
COPY nginx.conf /etc/nginx/nginx.conf
COPY site/ /usr/share/nginx/html/
# nginx itself, not the base image's entrypoint scripts: they edit config files, and the root filesystem is read-only.
ENTRYPOINT ["nginx", "-g", "daemon off;"]
