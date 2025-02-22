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
      "date": {
        "created_at": "2025-02-22",
        "updated_at": "2025-02-22"
      },
      "descriptions": {
        "app_name": "mailReminder",
        "app_description": "Notifies users about unreplied emails in their inbox",
        "app_logo": "\"\"",
        "app_url": "https://mailreminder.onrender.com",
        "background_color": "#fff"
      },
      "is_active": true,
      "integration_type": "interval",
      "integration_category": "Communication & Collaboration",
      "key_features": [
        "Email Check Interval",
        "Notification Channel ID",
        "Include Email Subjects"
      ],
      "author": "theChosenDevop",
      "settings": [
        {
          "label": "Email Check Interval",
          "type": "number",
          "required": true,
          "default": "5"
        },
        {
          "label": "Notification Channel ID",
          "type": "text",
          "required": true,
          "default": "true"
        },
        {
          "label": "Include Email Subjects",
          "type": "checkbox",
          "required": true,
          "default": "false"
        }
      ],
      "target_url": "\"\"",
      "tick_url": "https://mailreminder.onrender.com/api/tick"
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
