import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// API KEY MIDDLEWARE
app.use((req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized – Invalid API Key",
    });
  }

  next();
});

// SMTP TRANSPORTER
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// EMAIL ENDPOINT
app.get("/health", async (req, res) => {
  res.json({
    message: `Work now: ${new Date()}`,
  });
});

app.post("/api/send-email", async (req, res) => {
  const { name, from, to, subject, html, text } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${name}" <${from}>`,
      to,
      subject,
      text,
      html,
    });

    res.json({
      success: true,
      message: "Email sent",
      messageId: info.messageId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
});

// START SERVER
app.listen(process.env.PORT, () => {
  console.log(`Email service running on port ${process.env.PORT}`);
});
