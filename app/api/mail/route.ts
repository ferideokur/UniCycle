import { NextResponse } from 'next/server';
// @ts-ignore
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, fullName } = body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'unicycledestek@gmail.com',
        pass: 'cikeatsrwgokaicc'
      }
    });

    const mailOptions = {
      from: '"UniCycle Destek" <unicycledestek@gmail.com>',
      to: email,
      subject: 'UniCycle - Şifre Sıfırlama Kodu',
      html: `<div style="text-align:center; padding: 20px; font-family: Arial, sans-serif;">
               <h2>Merhaba ${fullName},</h2>
               <p>Şifrenizi sıfırlamak için doğrulama kodunuz:</p>
               <h1 style="color:#20B2AA; letter-spacing: 5px; font-size: 36px;">${otp}</h1>
             </div>`
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}