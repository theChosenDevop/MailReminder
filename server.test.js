const request = require("supertest");
const express = require("express");
const gmailRoutes = require("./routes/gmail");

const app = express();
app.use(express.json());
app.use("/api", gmailRoutes);

describe("Gmail API Routes", () => {
    test(
      "GET /api/gmail/unreplied - should return actual unreplied emails",
      async () => {
        const response = await request(app).get("/api/gmail/unreplied");
  
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("count");
        expect(response.body).toHaveProperty("emails");
        expect(Array.isArray(response.body.emails)).toBe(true);
      },
      15000 // Extend timeout to 15 seconds
    );
  });
  
