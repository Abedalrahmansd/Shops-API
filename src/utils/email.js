import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  auth: { user: config.EMAIL_USER, pass: config.EMAIL_PASS },
});

export const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({ from: config.EMAIL_USER, to, subject, text });
};