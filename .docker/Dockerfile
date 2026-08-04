## STAGE 1 ##################################
FROM node:24-alpine AS build

RUN npm config set engine-strict true

WORKDIR /app
COPY package*.json .
RUN npm ci

COPY . .

# VITE BUILD
# Nessun VITE_APIURL: in produzione UI e API stanno sullo stesso host e il
# percorso relativo /api viene instradato dall'ingress.
ENV NODE_ENV=production
ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

## STAGE 2 ##################################
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
