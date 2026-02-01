import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually since this script runs standalone
const loadEnv = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
    console.log("Loaded .env.local");
  } catch (e) {
    console.log("Could not load .env.local (might rely on system env)");
  }
};

loadEnv();

const test = async () => {
    console.log("--- Google Drive Auth Test ---");
    console.log(`Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'OK' : 'MISSING'}`);
    console.log(`Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? 'OK' : 'MISSING'}`);
    console.log(`Refresh Token: ${process.env.GOOGLE_REFRESH_TOKEN ? 'OK' : 'MISSING'}`);
    console.log(`Target Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID ? process.env.GOOGLE_DRIVE_FOLDER_ID : 'Root (My Drive)'}`);

    if (!process.env.GOOGLE_REFRESH_TOKEN) {
        console.error("ERROR: No Refresh Token found. The app will fallback to Service Account (which has no storage quota).");
        return;
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log("Attempting to list files...");
        const res = await drive.files.list({ pageSize: 3 });
        console.log("✅ Success! Authentication is working.");
        console.log(`Found ${res.data.files?.length} files.`);
        if (res.data.files && res.data.files.length > 0) {
            console.log("Sample file:", res.data.files[0].name);
        }
    } catch (e: any) {
        console.error("❌ Connection Failed!");
        console.error("Error Message:", e.message);
        if (e.response) {
            console.error("API Response:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
