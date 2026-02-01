import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

export const getDriveClient = (accessToken?: string) => {
  // 1. Client-side User Login
  if (accessToken) {
    // console.log("Auth: Using User Access Token");
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth });
  }

  // 2. Personal Account (Refresh Token) - RECOMMENDED
  if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // console.log("Auth: Using Refresh Token");
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ 
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN 
    });
    
    // Listen for new access tokens and log (optional debugging)
    auth.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        console.log('New refresh token received (update your .env if persistent):', tokens.refresh_token);
      }
    });

    return google.drive({ version: 'v3', auth });
  }

  // 3. Service Account Fallback
  // console.log("Auth: Using Service Account");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
};

export const listFiles = async (accessToken?: string) => {
  const drive = getDriveClient(accessToken);
  try {
    const q = process.env.GOOGLE_DRIVE_FOLDER_ID 
      ? `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`
      : "trashed = false";

    const response = await drive.files.list({
      pageSize: 50,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, size)',
      q,
      orderBy: "createdTime desc",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });
    return response.data.files;
  } catch (error: any) {
    console.error('Error listing files:', error.message);
    return [];
  }
};

export const uploadFile = async (file: File, customName?: string, accessToken?: string) => {
  console.log(`Starting upload: ${file.name}, Size: ${file.size}`);
  
  const drive = getDriveClient(accessToken);
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
    const mimeType = file.type || 'application/octet-stream';

    const requestBody: any = {
        name: customName || file.name,
        mimeType: mimeType,
    };

    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
        console.log(`Uploading to Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
        requestBody.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    } else {
        console.log("Uploading to root folder (My Drive)");
    }

    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });
    console.log("Upload success:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error('Error uploading file (Full details):', JSON.stringify(error, null, 2));
    throw new Error(error.message || "Upload failed");
  }
};

export const deleteFile = async (fileId: string, accessToken?: string) => {
  const drive = getDriveClient(accessToken);
  try {
    await drive.files.delete({
      fileId: fileId,
      supportsAllDrives: true,
    });
    return true;
  } catch (error: any) {
    console.error('Error deleting file:', error.message);
    throw error;
  }
};