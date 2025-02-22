const express = require("express");
const gmailRoutes = require("./routes/gmail");
require('dotenv').config();


const app = express();
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
const token = JSON.parse(process.env.GOOGLE_TOKEN || '{}');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", gmailRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
