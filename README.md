# Mail Reminder

## 📌 Overview
The **Mail Reminder** is a Node.js application that connects to the Gmail API and retrieves unreplied emails from the user's inbox. It provides API endpoints that return the count and subject lines of these emails, allowing users to stay on top of pending messages. Additionally, it stores the email data in `integration.json` for persistent access.

## 🚀 Features
- **OAuth 2.0 Authentication** with Google API
- **Fetches Unreplied Emails** from the inbox
- **Returns Email Count & Subjects**
- **Express.js API Endpoints** for easy integration
- **Saves Data to `integration.json`** for persistence
- **Error Handling** for API failures

## 🛠️ Tech Stack
- **Node.js** (Backend runtime)
- **Express.js** (Web framework)
- **Google Gmail API** (Email retrieval)
- **Supertest & Jest** (Testing framework)

## 📚 Project Structure
```
/node_gmail
ﬂ─ index.js              # Main entry point
ﬂ─ package.json         # Dependencies & scripts
ﬂ─ server.test.js       # Test file (Jest & Supertest)
ﬂ─ token.json          # OAuth token file
ﬂ─ credentials.json    # Google API credentials
ﬂ─ integration.json    # Stores retrieved email data
ﬂ─ node_modules/       # Node dependencies
ﬂ─ routes/
       ﬂ─ gmail.js    # Gmail API routes
```

## 📎 Installation
### 1️⃣ Clone the repository
```sh
git clone https://github.com/theChosenDevop/MailReminder.git
cd MailReminder
```

### 2️⃣ Install dependencies
```sh
npm install
```

### 3️⃣ Setup Google API Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API**.
3. Generate **OAuth 2.0 credentials** and download the `credentials.json` file.
4. Place `credentials.json` in the root directory.

### 4️⃣ Run the application
```sh
npm start
```
The server will run on `http://localhost:3000`

## 🔥 Usage
### 📌 GET Unreplied Emails
**Endpoint:** `GET /api/gmail/unreplied`

**Response:**
```json
{
  "count": 2,
  "emails": [
    { "id": "123", "subject": "Frontend Developer Opportunity" },
    { "id": "456", "subject": "Meeting Confirmation" }
  ]
}
```

### 📌 GET Integration Data
**Endpoint:** `GET /integration.json`

**Description:**
Returns the stored email data from `integration.json`.

**Response:**
```json
{
  "count": 2,
  "emails": [
    { "id": "123", "subject": "Frontend Developer Opportunity" },
    { "id": "456", "subject": "Meeting Confirmation" }
  ]
}
```

## 🧖🏽‍♂️ Running Tests
To run unit tests:
```sh
npm test
```

## 🤖 Troubleshooting
- **Issue: `GaxiosError: Insufficient Permission`**
  - Ensure the Gmail API is enabled for your Google account.
  - Delete `token.json` and reauthenticate.

- **Issue: Timeout during tests**
  - Increase Jest timeout in `server.test.js`:
  ```js
  jest.setTimeout(15000);
  ```

## 🎯 Future Improvements
- Add **email auto-reply** feature
- Implement **frontend UI** for notifications
- Enhance **error handling** and **logging**

## 📝 License
MIT License © 2025 Oluwatobi Adesanya

---
### 👨‍💻 Author
[Oluwatobi Adesanya](https://github.com/thechosenDevop)

