// Configuration for Chrome Extension
// Update these values based on your environment

const CONFIG = {
  // Development configuration
  development: {
    dashboardUrl: "http://localhost:8080",
    supabaseUrl: "https://dzvilnveshfhxcmmpipo.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmlsbnZlc2hmaHhjbW1waXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzc4NDcsImV4cCI6MjA4ODU1Mzg0N30.Pj7k9ZYMK-jSDl2QBhco6nIpqMPYvIw0UqHde7px1lY"
  },

  // Production configuration
  production: {
    dashboardUrl: "https://job-hunting-in-france.lovable.app",
    supabaseUrl: "https://dzvilnveshfhxcmmpipo.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dmlsbnZlc2hmaHhjbW1waXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzc4NDcsImV4cCI6MjA4ODU1Mzg0N30.Pj7k9ZYMK-jSDl2QBhco6nIpqMPYvIw0UqHde7px1lY"
  }
};

// Set the current environment here: 'development' or 'production'
const ENVIRONMENT = 'production';

// Export the current configuration
const CURRENT_CONFIG = CONFIG[ENVIRONMENT];
