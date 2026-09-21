FROM apify/actor-node:20 AS builder

WORKDIR /usr/src/app

COPY --chown=myuser:myuser package.json tsconfig.json tsconfig.base.json ./
COPY --chown=myuser:myuser src ./src
COPY --chown=myuser:myuser bundled-shared ./bundled-shared

WORKDIR /usr/src/app/bundled-shared
RUN npm install --audit=false
RUN npm run build

WORKDIR /usr/src/app
RUN node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.dependencies['@scouvela/shared']='file:./bundled-shared'; p.scripts.start='node dist/main.js'; fs.writeFileSync('package.json', JSON.stringify(p, null, 2));"

RUN npm install --include=dev --audit=false
RUN npm run build

FROM apify/actor-node:20

WORKDIR /usr/src/app

COPY --from=builder --chown=myuser:myuser /usr/src/app/package.json ./
COPY --from=builder --chown=myuser:myuser /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=myuser:myuser /usr/src/app/dist ./dist
COPY --from=builder --chown=myuser:myuser /usr/src/app/bundled-shared ./bundled-shared

CMD ["node", "dist/main.js"]
