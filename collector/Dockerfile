FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install --silent || yarn || pnpm i
COPY tsconfig.json ./
COPY src ./src
CMD ["npm","start"]
