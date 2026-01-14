const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const { moderate } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Public auth routes
app.use('/api/auth', authRouter);

// API Routes (rate limited)
app.use('/api', moderate);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/admin', adminRouter);

// Health
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

app.use(errorHandler);

module.exports = app;
