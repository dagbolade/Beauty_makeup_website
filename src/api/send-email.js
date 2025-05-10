// /api/send-email.js - Email sending endpoint for enquiry confirmations
import nodemailer from 'nodemailer';

// Configure email transport
// For production, use your actual SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your actual email in .env
    pass: process.env.EMAIL_PASSWORD || 'your-app-password', // Replace with your actual password in .env
  },
});

// Function to verify transporter connection
const verifyTransporter = async () => {
  try {
    const verification = await transporter.verify();
    console.log('SMTP connection established:', verification);
    return true;
  } catch (error) {
    console.error('SMTP connection error:', error);
    return false;
  }
};

// Email templates
const getClientEmailTemplate = (data) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8bbd0; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #fff; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .enquiry-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .note { border-left: 4px solid #f8bbd0; padding-left: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #e91e63; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Enquiry!</h1>
    </div>
    <div class="content">
      <p>Hello {{clientName}},</p>
      <p>Thank you for your interest in Yemisi Artistry. We have received your enquiry and will get back to you soon to discuss the details and confirm your appointment.</p>
      
      <div class="enquiry-details">
        <h3>Your Enquiry Details:</h3>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Option:</strong> {{serviceOption}}</p>
        <p><strong>Requested Date:</strong> {{date}}</p>
        <p><strong>Requested Time:</strong> {{time}}</p>
      </div>
      
      <div class="note">
        <p>Please note that your appointment is not confirmed yet. Yemisi will contact you to discuss pricing, availability, and any specific requirements you may have.</p>
      </div>
      
      <p>If you have any questions or need to update your enquiry, please don't hesitate to contact us at <a href="mailto:info@yemisiartistry.com">info@yemisiartistry.com</a> or call us at [YOUR PHONE NUMBER].</p>
      
      <p>We look forward to working with you!</p>
      
      <p>Warm regards,<br>
      Yemisi<br>
      Yemisi Artistry</p>
    </div>
    <div class="footer">
      <p>© {{year}} Yemisi Artistry. All rights reserved.</p>
      <p>Instagram: <a href="https://instagram.com/yemisiartistry">@yemisiartistry</a> | Email: <a href="mailto:info@yemisiartistry.com">info@yemisiartistry.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

const getBusinessEmailTemplate = (data) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #e1bee7; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .client-details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .enquiry-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .notes { background-color: #fffde7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffd54f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Enquiry Alert</h1>
    </div>
    <div class="content">
      <p>Hello Yemisi,</p>
      <p>You have received a new enquiry for your services.</p>
      
      <div class="client-details">
        <h3>Client Information:</h3>
        <p><strong>Name:</strong> ${data.clientName}</p>
        <p><strong>Email:</strong> ${data.clientEmail}</p>
        <p><strong>Phone:</strong> ${data.clientPhone}</p>
      </div>
      
      <div class="enquiry-details">
        <h3>Enquiry Details:</h3>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Option:</strong> ${data.serviceOption}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
      </div>
      
      ${data.notes ? `
      <div class="notes">
        <h3>Client Notes:</h3>
        <p>${data.notes}</p>
      </div>
      ` : ''}
      
      <p>Please respond to this enquiry at your earliest convenience to confirm availability.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify SMTP connection first
    const isTransporterValid = await verifyTransporter();
    if (!isTransporterValid) {
      console.warn('Email transport verification failed, will attempt to send anyway');
    }

    const { to, subject, text, template, data } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ message: 'Email recipient and subject are required' });
    }

    // Determine which email template to use
    let htmlContent = text;
    
    if (template === 'client-confirmation' && data) {
      htmlContent = getClientEmailTemplate(data);
    } else if (template === 'business-notification' && data) {
      htmlContent = getBusinessEmailTemplate(data);
    } else if (!htmlContent) {
      // Simple default HTML if no template is specified and no HTML content is provided
      htmlContent = `<div style="font-family: Arial, sans-serif;">${text}</div>`;
    }

    // Configure email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Yemisi Artistry" <info@yemisiartistry.com>',
      to,
      subject,
      html: htmlContent,
      // Add plain text fallback for email clients that don't support HTML
      text: text || `Enquiry confirmation for ${data?.serviceName} on ${data?.date} at ${data?.time}.`,
    };

    console.log('Attempting to send email to:', to);
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      message: 'Failed to send email', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}