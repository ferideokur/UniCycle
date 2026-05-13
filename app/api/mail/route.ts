import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, otp, type } = await req.json();

    // 1. Ortam değişkenlerini (Environment Variables) alıyoruz
    const { GMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;

    // 2. VERCEL İÇİN KRİTİK KONTROL
    console.log("🛠️ UniCycle ENV DEĞİŞKENLERİ KONTROLÜ:", {
      GMAIL_USER: GMAIL_USER ? "✅ VAR" : "❌ YOK",
      CLIENT_ID: CLIENT_ID ? "✅ VAR" : "❌ YOK",
      CLIENT_SECRET: CLIENT_SECRET ? "✅ VAR" : "❌ YOK",
      REFRESH_TOKEN: REFRESH_TOKEN ? "✅ VAR" : "❌ YOK",
    });

    // 🕵️ VERCEL AJAN LOGU: Vercel bu değişkenleri bozuyor mu?
    console.log("🕵️ AJAN KONTROLÜ:", {
      clientIdLength: CLIENT_ID ? CLIENT_ID.length : 0,
      startsWithQuote: CLIENT_ID ? (CLIENT_ID.startsWith('"') || CLIENT_ID.startsWith("'")) : false,
      endsWithGoogle: CLIENT_ID ? CLIENT_ID.trim().endsWith('googleusercontent.com') : false,
      hasTrailingSpace: CLIENT_ID ? CLIENT_ID !== CLIENT_ID.trim() : false
    });

    // 3. Eğer değişkenlerden biri bile eksikse işlemi durdur!
    if (!GMAIL_USER || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      console.error("🚨 HATA: OAuth2 kimlik bilgileri eksik! Vercel Environment Variables kısmını kontrol et.");
      return NextResponse.json(
        { error: 'Sunucu e-posta yapılandırması eksik.' },
        { status: 500 }
      );
    }

    // 4. Taşıyıcıyı (Transporter) GÜVENLE VE TEMİZLEYEREK oluştur
    // DİKKAT: Vercel'in ekleyebileceği gizli tırnakları ve boşlukları zorla siliyoruz!
    const cleanClientId = CLIENT_ID.replace(/['"]/g, '').trim();
    const cleanClientSecret = CLIENT_SECRET.replace(/['"]/g, '').trim();
    const cleanRefreshToken = REFRESH_TOKEN.replace(/['"]/g, '').trim();
    const cleanGmailUser = GMAIL_USER.replace(/['"]/g, '').trim();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: cleanGmailUser,
        clientId: cleanClientId,
        clientSecret: cleanClientSecret,
        refreshToken: cleanRefreshToken
      }
    });

    let mailOptions = {};

    // EĞER ADMİN ONAYLADIYSA BU MAİL GİDECEK
    if (type === 'approve') {
      mailOptions = {
        from: `"UniCycle" <${cleanGmailUser}>`,
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
        from: `"UniCycle Destek" <${cleanGmailUser}>`,
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

    // 5. Maili gönder
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Mail başarıyla gönderildi!' }, { status: 200 });
    
  } catch (error) {
    console.error("❌ Mail Gönderme Hatası:", error);
    return NextResponse.json({ error: 'Mail gönderilemedi.' }, { status: 500 });
  }
}