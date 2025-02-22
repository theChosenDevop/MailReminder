const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const axios = require('axios');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const router = express.Router();
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

const TELEX_WEBHOOK_URL = 'https://ping.telex.im/v1/webhooks/01952f59-407f-70a3-89d2-ce6e6809dbfd';

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

// Authenticate user
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) return client;
  client = await authenticate({ scopes: SCOPES, keyfilePath: CREDENTIALS_PATH });
  return client;
}

// Fetch unreplied emails
async function getUnrepliedEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox -in:chats -from:me -has:userlabels older_than:1d is:unread',
  });

  return res.data.messages || [];
}

// Get email subject
async function getEmailSubject(auth, messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.get({ userId: "me", id: messageId });
  const headers = res.data.payload.headers;
  const subjectHeader = headers.find(header => header.name === "Subject");
  return subjectHeader ? subjectHeader.value : "(No Subject)";
}

// ✅ `integration.json` Telex Schema
router.get('/integration.json', async (req, res) => {
  const base_url ="https://mailreminder.onrender.com";
  res.json({
    "data": {
        "descriptions": {
            "app_name": "Gmail Unreplied Email Notifier",
            "app_description": "Notifies about unreplied Gmail emails",
            "app_url": base_url,
            "app_logo": "https://i.imgur.com/lZqvffp.png", 
            "background_color": "#fff"
        },
        "integration_type": "interval",
        "settings": [],
        "tick_url": `${base_url}/api/tick` 
    }
});
});

// ✅ `tick` Endpoint (Triggered by Telex)
router.post('/tick', async (req, res) => {
  try {
    const auth = await authorize();
    const emails = await getUnrepliedEmails(auth);

    const emailSubjects = await Promise.all(
      emails.map(async email => {
        const subject = await getEmailSubject(auth, email.id);
        return { id: email.id, subject };
      })
    );

    // Save to integration.json
    await fs.writeFile('integration.json', JSON.stringify(emailSubjects, null, 2));

    // Send webhook notification
    if (emailSubjects.length > 0) {
      await axios.post(TELEX_WEBHOOK_URL, {
        message: `You have ${emailSubjects.length} unreplied emails.`,
        emails: emailSubjects,
        username: "Gmail Notifier",
        event_name: "Unreplied Emails",
        status: "warning"
      });
    }

    res.status(202).json({ status: "accepted", count: emailSubjects.length });

  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
