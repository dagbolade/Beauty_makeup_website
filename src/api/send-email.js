import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email to Yemisi (Admin)
export async function notifyAdmin(enquiry) {
  const html = `
    <h2>New Booking Enquiry</h2>
    <p><strong>Client:</strong> ${enquiry.client_name}</p>
    <p><strong>Email:</strong> ${enquiry.client_email}</p>
    <p><strong>Phone:</strong> ${enquiry.client_phone || 'N/A'}</p>
    <p><strong>Service:</strong> ${enquiry.service_option}</p>
    <p><strong>Date:</strong> ${enquiry.enquiry_date}</p>
    <p><strong>Notes:</strong> ${enquiry.notes || 'None'}</p>
  `;

  return resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'afolayanoyindamola33@gmail.com',
    subject: `📩 New Booking Enquiry: ${enquiry.client_name}`,
    html,
  });
}

// Email to User (Confirmation)
export async function notifyClient(enquiry) {
  const html = `
    <h2>Hi ${enquiry.client_name},</h2>
    <p>Thank you for your enquiry for <strong>${enquiry.service_option}</strong> on ${enquiry.enquiry_date}.</p>
    <p>We'll get back to you shortly to confirm your booking.</p>
    <p>— Artistry by Yemisi 💄</p>
  `;

  return resend.emails.send({
    from: 'onboarding@resend.dev',
    to: enquiry.client_email,
    subject: 'Thank You for Your Enquiry',
    html,
  });
}
