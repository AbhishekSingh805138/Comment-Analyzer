FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install --silent || yarn || pnpm i
COPY . .
ENV NEXT_PUBLIC_ANALYZER_URL=http://analyzer:8000/summary
RUN npm run build || true
CMD ["npm","run","dev"]
