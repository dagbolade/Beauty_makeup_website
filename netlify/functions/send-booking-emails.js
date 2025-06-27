// netlify/functions/send-booking-emails.js

const { Resend } = require('resend');

const resend = new Resend('re_f3M7Mrpe_YcybGbdNgo9n7NnMJX61SC3N');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    const { type, ...enquiry } = requestData;
    
    // Validate required fields based on type
    if (type === 'booking') {
      if (!enquiry.client_name || !enquiry.client_email || !enquiry.service_option) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields for booking' }),
        };
      }
    } else if (type === 'contact') {
      if (!enquiry.name || !enquiry.email || !enquiry.subject || !enquiry.message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields for contact' }),
        };
      }
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request type' }),
      };
    }

    let adminEmailHtml, clientEmailHtml, adminSubject, clientSubject;

    if (type === 'booking') {
      // Format the enquiry date for booking
      const formattedDate = enquiry.enquiry_date ? 
        new Date(enquiry.enquiry_date).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Not specified';

      adminSubject = `📩 New Booking Enquiry: ${enquiry.client_name} - ${enquiry.service_option}`;
      clientSubject = '✨ Thank You for Your Booking Enquiry - Yemisi Artistry';

      // Booking email templates
      adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">✨ New Booking Enquiry</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Client Details</h3>
              <p><strong>Name:</strong> ${enquiry.client_name}</p>
              <p><strong>Email:</strong> <a href="mailto:${enquiry.client_email}">${enquiry.client_email}</a></p>
              <p><strong>Phone:</strong> ${enquiry.client_phone || 'Not provided'}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Booking Details</h3>
              <p><strong>Service:</strong> ${enquiry.service_option}</p>
              <p><strong>Preferred Date:</strong> ${formattedDate}</p>
              ${enquiry.time ? `<p><strong>Time:</strong> ${enquiry.time}</p>` : ''}
              ${enquiry.notes ? `<p><strong>Special Notes:</strong> ${enquiry.notes}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${enquiry.client_email}" style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reply to Client</a>
            </div>
          </div>
        </div>
      `;

      clientEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">💄 Yemisi Artistry</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1f2937; margin-top: 0;">Hi ${enquiry.client_name}! ✨</h3>
              
              <p style="color: #374151; line-height: 1.6;">
                Thank you so much for your interest in our makeup artistry services! We're absolutely thrilled to hear from you.
              </p>
              
              <div style="background: #fef3f3; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ec4899;">
                <p style="margin: 0; color: #374151;"><strong>Your Booking Details:</strong></p>
                <p style="margin: 5px 0; color: #374151;">📅 <strong>Service:</strong> ${enquiry.service_option}</p>
                <p style="margin: 5px 0; color: #374151;">🗓️ <strong>Date:</strong> ${formattedDate}</p>
                ${enquiry.time ? `<p style="margin: 5px 0; color: #374151;">🕐 <strong>Time:</strong> ${enquiry.time}</p>` : ''}
              </div>
              
              <p style="color: #374151; line-height: 1.6;">
                We'll review your request and get back to you within 24 hours to discuss the details and confirm your booking. 
                If you have any urgent questions, feel free to reach out to us directly.
              </p>
              
              <p style="color: #374151; line-height: 1.6;">
                We can't wait to help you look absolutely stunning! ✨
              </p>
              
              <p style="color: #374151; margin-top: 30px;">
                Best regards,<br>
                <strong>The Yemisi Artistry Team</strong><br>
                <span style="color: #6b7280;">📧 afolayanoyindamola33@gmail.com</span><br>
                <span style="color: #6b7280;">📱 +447944247941</span><br>
                <span style="color: #6b7280;">📷 Follow us on Instagram @artistrybyyemisi</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated confirmation. Please don't reply to this email.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'contact') {
      // Contact form email templates
      adminSubject = `📞 New Contact Message: ${enquiry.name} - ${enquiry.subject}`;
      clientSubject = '✨ Thank You for Contacting Yemisi Artistry';

      adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">📞 New Contact Message</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Contact Details</h3>
              <p><strong>Name:</strong> ${enquiry.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${enquiry.email}">${enquiry.email}</a></p>
              <p><strong>Subject:</strong> ${enquiry.subject}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Message</h3>
              <p style="white-space: pre-wrap;">${enquiry.message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${enquiry.email}" style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reply to Contact</a>
            </div>
          </div>
        </div>
      `;

      clientEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">💄 Yemisi Artistry</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1f2937; margin-top: 0;">Hi ${enquiry.name}! ✨</h3>
              
              <p style="color: #374151; line-height: 1.6;">
                Thank you for reaching out to us! We've received your message and really appreciate you taking the time to contact us.
              </p>
              
              <div style="background: #fef3f3; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ec4899;">
                <p style="margin: 0; color: #374151;"><strong>Your Message:</strong></p>
                <p style="margin: 5px 0; color: #374151;"><strong>Subject:</strong> ${enquiry.subject}</p>
                <p style="margin: 10px 0; color: #374151; font-style: italic;">"${enquiry.message.length > 100 ? enquiry.message.substring(0, 100) + '...' : enquiry.message}"</p>
              </div>
              
              <p style="color: #374151; line-height: 1.6;">
                We'll get back to you as soon as possible, usually within 24 hours. If your enquiry is urgent, 
                feel free to reach out to us on Instagram @yemisiartistry.
              </p>
              
              <p style="color: #374151; line-height: 1.6;">
                Thank you for your interest in Yemisi Artistry! ✨
              </p>
              
              <p style="color: #374151; margin-top: 30px;">
                Best regards,<br>
                <strong>The Yemisi Artistry Team</strong><br>
                <span style="color: #6b7280;">📧 afolayanoyindamola33@gmail.com</span><br>
                <span style="color: #6b7280;">📱 +447944247941</span><br>
                <span style="color: #6b7280;">📷 Follow us on Instagram @artistrybyyemisi</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated confirmation. Please don't reply to this email.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    // Send both emails
    const [adminResult, clientResult] = await Promise.all([
      // Admin notification
      resend.emails.send({
        from: 'Yemisi Artistry <bookings@yemisiartistry.com>',
        to: 'afolayanoyindamola33@gmail.com', // Yemisi's actual email
        subject: adminSubject,
        html: adminEmailHtml,
      }),
      
      // Client confirmation
      resend.emails.send({
        from: 'Yemisi Artistry <bookings@yemisiartistry.com>',
        to: type === 'booking' ? enquiry.client_email : enquiry.email,
        subject: clientSubject,
        html: clientEmailHtml,
      })
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Emails sent successfully',
        adminEmailId: adminResult.data?.id,
        clientEmailId: clientResult.data?.id
      }),
    };

  } catch (error) {
    console.error('Email sending error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to send emails', 
        details: error.message 
      }),
    };
  }
};