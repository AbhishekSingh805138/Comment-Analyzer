# dashboard/Dockerfile
FROM node:20-alpine
WORKDIR /app

# 1) Copy only manifests first (faster, reliable caching)
COPY package.json package-lock.json ./

# 2) Install dependencies with network-friendly options
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set network-timeout 300000 && \
    npm install --no-audit --no-fund --maxsockets 1 || \
    npm install --legacy-peer-deps --maxsockets 1

# 3) Copy the rest of the app
COPY . .

# 4) Runtime env for the dashboard
ENV NEXT_PUBLIC_ANALYZER_URL=http://analyzer:8000/summary

# 5) Build (optional for dev), then run dev server
# For dev image:
EXPOSE 3000
CMD ["npm","run","dev"]

# ---- If you want a prod image instead, swap last two lines for: ----
# RUN npm run build
# EXPOSE 3000
# CMD ["npm","run","start"]
