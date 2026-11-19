# Usa una imagen oficial de Node.js (v18.17.0-alpine es ligera)
FROM node:18.17.0-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm ci --omit=dev

# Copia el resto de los archivos del proyecto
COPY . .

# Expone el puerto en el que corre tu app (ajústalo si usas otro)
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
