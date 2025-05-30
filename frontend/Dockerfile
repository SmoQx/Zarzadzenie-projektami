FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap serwowania przez Nginx
FROM nginx:alpine
# Kopiujemy nasz własny plik konfiguracyjny
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Kopiujemy cały zbudowany frontend
COPY --from=build /app /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
