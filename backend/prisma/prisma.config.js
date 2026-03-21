// prisma/prisma.config.js
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  datasource: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});