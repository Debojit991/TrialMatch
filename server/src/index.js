const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`TrialMatch API Server running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===========================================`);
});
