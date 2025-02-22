const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const router = express.Router();

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const INTEGRATION_FILE = path.join(process.cwd(), 'integration.json');

// Load saved credentials
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

// Save credentials after authorization
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

// Authenticate user
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) return client;
  client = await authenticate({ scopes: SCOPES, keyfilePath: CREDENTIALS_PATH });
  if (client.credentials) await saveCredentials(client);
  return client;
}

// Fetch unreplied emails
async function getUnrepliedEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  // Search for unread, unreplied emails (excluding chats and sent emails)
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox -in:chats -from:me -has:userlabels older_than:1d is:unread',
  });

  const messages = res.data.messages;
  if (!messages || messages.length === 0) {
    console.log("No unreplied emails found.");
    return [];
  }

  console.log(`Found ${messages.length} unreplied emails.`);
  return messages;
}

// Get email subject
async function getEmailSubject(auth, messageId) {
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });

  const headers = res.data.payload.headers;
  const subjectHeader = headers.find(header => header.name === "Subject");

  return subjectHeader ? subjectHeader.value : "(No Subject)";
}

// Route to fetch unreplied emails and save to integration.json
router.get('/gmail/unreplied', async (req, res) => {
  try {
    const auth = await authorize();
    const emails = await getUnrepliedEmails(auth);

    const emailSubjects = await Promise.all(
      emails.map(async email => {
        const subject = await getEmailSubject(auth, email.id);
        return { id: email.id, subject };
      })
    );

    // Save output to integration.json
    await fs.writeFile(INTEGRATION_FILE, JSON.stringify({ count: emailSubjects.length, emails: emailSubjects }, null, 2));

    res.json({ count: emailSubjects.length, emails: emailSubjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to serve integration.json file
router.get('/integration.json', async (req, res) => {
  try {
    const data = await fs.readFile(INTEGRATION_FILE, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: 'Error reading integration.json' });
  }
});

module.exports = router;
