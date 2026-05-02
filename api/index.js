try {
  const app = require('../server/src/index.js');
  module.exports = app;
} catch (error) {
  console.error('CRITICAL STARTUP ERROR:', error);
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: 'Backend failed to start', 
      details: error.message,
      stack: error.stack 
    });
  };
}
