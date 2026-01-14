require('dotenv').config();
const config = require('./config');
const app = require('./src/app');

const port = config.server.port || process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Selfcare Sinners POS listening on port ${port} — ${config.company.name}`);
});
