import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // type değişkeni ekledik: 'reset' veya 'approve' olacak
    const { email, otp, type } = await req.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, 
      },
    });

    let mailOptions = {};

    // EĞER ADMİN ONAYLADIYSA BU MAİL GİDECEK
    if (type === 'approve') {
      mailOptions = {
        from: `"UniCycle" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🎉 UniCycle Hesabınız Onaylandı!',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8fafc; border-radius: 10px;">
            <h2 style="color: #20B2AA; font-size: 28px; margin-bottom: 10px;">Aramıza Hoş Geldiniz!</h2>
            <p style="color: #475569; font-size: 16px;">Merhaba,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Öğrenci belgeniz yöneticilerimiz tarafından başarıyla incelendi ve <b>UniCycle</b> üyeliğiniz aktif edildi!</p>
            
            <div style="margin: 40px 0;">
              <a href="https://uni-cycle-seven.vercel.app/login" style="background-color: #20B2AA; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(32, 178, 170, 0.2);">Hemen Giriş Yapın</a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">Kampüs pazarında harika fırsatlar sizi bekliyor.</p>
          </div>
        `,
      };
    } 
    // EĞER ŞİFREMİ UNUTTUM DEDİYSE ESKİ MAİL GİDECEK
    else {
      mailOptions = {
        from: `"UniCycle Destek" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'UniCycle - Şifre Sıfırlama Kodunuz',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 30px; background-color: #f8fafc; border-radius: 10px;">
            <h2 style="color: #0f2e36;">Şifre Sıfırlama Talebi</h2>
            <p style="color: #475569; font-size: 16px;">Merhaba,</p>
            <p style="color: #475569; font-size: 16px;">Şifrenizi sıfırlamak için 6 haneli doğrulama kodunuz aşağıdadır:</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: white; border-radius: 8px; border: 2px dashed #20B2AA; display: inline-block;">
              <h1 style="color: #20B2AA; font-size: 40px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px;">Bu kodu kimseyle paylaşmayın. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
        `,
      };
    }

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Mail başarıyla gönderildi!' }, { status: 200 });
    
  } catch (error) {
    console.error("Mail Hatası:", error);
    return NextResponse.json({ error: 'Mail gönderilemedi.' }, { status: 500 });
  }
}