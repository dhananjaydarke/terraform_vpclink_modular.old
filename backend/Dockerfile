FROM node:22.21.0-alpine3.21
WORKDIR /opt/app
COPY src/ .
COPY ecosystem.config.cjs .
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install --ignore-scripts && \
    npm install -g pm2 --ignore-scripts && \
    apk add --no-cache aws-cli curl && \
    rm -rf /opt/app/node_modules/nssocket/test/fixtures || true
USER node
CMD ["sh", "-c", "node pullCerts.js && pm2-runtime start ecosystem.config.cjs"]
