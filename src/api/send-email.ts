import nodemailer from 'nodemailer';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(bodyParser.json());
const port = 5000;

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Your Gmail address
    pass: process.env.EMAIL_PASS   // Your Gmail app password
  }
});

// 📌 Send Email Route
app.post('/api/send-email', async (req: Request, res: Response) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    res.status(200).json({ message: `Email sent to ${to}` });
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
