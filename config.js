module.exports = {
  company: {
    name: process.env.COMPANY_NAME || 'Selfcare Sinners',
    slogan: 'FAST MONEY MAKERS',
    currency: process.env.COMPANY_CURRENCY || 'USD',
    logoUrl: process.env.COMPANY_LOGO_URL || '/public/logo.png'
  },
  server: {
    port: process.env.PORT || 4000
  },
  alerts: {
    defaultReorderLevel: 5
  }
};
