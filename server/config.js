export const config = {
  // Google Sheets Configuration
  GOOGLE_SHEETS_SPREADSHEET_ID: '1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98',
  
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS Origins
  CORS_ORIGINS: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://localhost:5000'
  ]
};

