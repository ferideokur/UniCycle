"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Upload,
  KeyRound,
  ArrowRight
} from "lucide-react";

// Türkiye'deki Üniversiteler Listesi
const UNIVERSITIES = [
  "Acıbadem Üniversitesi",
  "Akdeniz Üniversitesi",
  "Anadolu Üniversitesi",
  "Ankara Üniversitesi",
  "Atatürk Üniversitesi",
  "Bahçeşehir Üniversitesi",
  "Başkent Üniversitesi",
  "Bilkent Üniversitesi",
  "Boğaziçi Üniversitesi",
  "Bursa Uludağ Üniversitesi",
  "Celal Bayar Üniversitesi",
  "Çanakkale Onsekiz Mart Üniversitesi",
  "Çukurova Üniversitesi",
  "Dicle Üniversitesi",
  "Dokuz Eylül Üniversitesi",
  "Ege Üniversitesi",
  "Erciyes Üniversitesi",
  "Eskişehir Osmangazi Üniversitesi",
  "Fırat Üniversitesi",
  "Galatasaray Üniversitesi",
  "Gazi Üniversitesi",
  "Gaziantep Üniversitesi",
  "Gebze Teknik Üniversitesi",
  "Hacettepe Üniversitesi",
  "Hasan Kalyoncu Üniversitesi",
  "Isparta Süleyman Demirel Üniversitesi",
  "İbn Haldun Üniversitesi",
  "İstanbul Aydın Üniversitesi",
  "İstanbul Bilgi Üniversitesi",
  "İstanbul Kültür Üniversitesi",
  "İstanbul Medipol Üniversitesi",
  "İstanbul Okan Üniversitesi",
  "İstanbul Sabahattin Zaim Üniversitesi",
  "İstanbul Teknik Üniversitesi (İTÜ)",
  "İstanbul Ticaret Üniversitesi",
  "İstanbul Üniversitesi",
  "İzmir Ekonomi Üniversitesi",
  "İzmir Katip Çelebi Üniversitesi",
  "İzmir Yüksek Teknoloji Enstitüsü (İYTE)",
  "Kadir Has Üniversitesi",
  "Karadeniz Teknik Üniversitesi (KTÜ)",
  "Kırıkkale Üniversitesi",
  "Kocaeli Üniversitesi",
  "Koç Üniversitesi",
  "Marmara Üniversitesi",
  "Mef Üniversitesi",
  "Mimar Sinan Güzel Sanatlar Üniversitesi",
  "Muğla Sıtkı Koçman Üniversitesi",
  "Ondokuz Mayıs Üniversitesi",
  "Orta Doğu Teknik Üniversitesi (ODTÜ)",
  "Özyeğin Üniversitesi",
  "Pamukkale Üniversitesi",
  "Piri Reis Üniversitesi",
  "Sabancı Üniversitesi",
  "Sakarya Üniversitesi",
  "Selçuk Üniversitesi",
  "TOBB Ekonomi ve Teknoloji Üniversitesi",
  "Trakya Üniversitesi",
  "Türk-Alman Üniversitesi",
  "Yeditepe Üniversitesi",
  "Yıldız Teknik Üniversitesi (YTÜ)",
  "Diğer...",
];

const translateBackendMessage = (msg: string) => {
  if (!msg) return "Bir hata oluştu, lütfen tekrar deneyin.";
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes("already exist") || lowerMsg.includes("taken"))
    return "Bu e-posta adresi zaten kullanımda.";
  if (
    lowerMsg.includes("bad credentials") ||
    lowerMsg.includes("wrong password") ||
    lowerMsg.includes("invalid") ||
    lowerMsg.includes("login failed")
  )
    return "E-posta adresiniz veya şifreniz hatalı.";
  if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist"))
    return "Bu e-posta adresine ait bir hesap bulunamadı.";
  if (lowerMsg.includes("login successful"))
    return "Giriş başarılı! Yönlendiriliyorsun...";
  if (lowerMsg.includes("register successful") || lowerMsg.includes("created"))
    return "Başarıyla kayıt oldun! Lütfen giriş yap.";

  return "İşlem başarısız oldu. Lütfen bilgilerinizi kontrol edin.";
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  // HAFIZALAR
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [studentDoc, setStudentDoc] = useState<File | null>(null);

  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");

  // ŞİFREMİ UNUTTUM HAFIZALARI
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1); 
  const [otpCode, setOtpCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | ""
  >("");
  const [isLoading, setIsLoading] = useState(false);

  // 🛡️ BELGE GÜVENLİK VE UYUMLULUK KONTROLÜ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMessageType("error");
        setMessage("Lütfen sadece PDF, JPG veya PNG formatında bir belge yükleyin.");
        e.target.value = ''; 
        setStudentDoc(null);
        return;
      }
      
      const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSizeInBytes) {
        setMessageType("error");
        setMessage("Belgenizin boyutu çok büyük. Lütfen 5MB'dan daha küçük bir dosya yükleyin.");
        e.target.value = ''; 
        setStudentDoc(null);
        return;
      }

      setStudentDoc(file);
      setMessageType("");
      setMessage("");
    } else {
      setStudentDoc(null);
    }
  };

  // 🚀 ADIM 1: MAİLE KOD GÖNDERME (GERÇEK BACKEND BAĞLANTISI)
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessageType("info");
    setMessage("E-posta adresiniz kontrol ediliyor ve kod gönderiliyor...");

    try {
      const response = await fetch(`https://unicycle-api.onrender.com/api/users/forgot-password?email=${encodeURIComponent(email)}`, { 
        method: "POST" 
      });
      
      if (response.status === 404 || response.status === 400) {
        throw new Error("NOT_FOUND");
      }
      if (!response.ok) {
        throw new Error("SERVER_ERROR");
      }

      setMessageType("success");
      setMessage("Doğrulama kodu e-postanıza gönderildi!");
      setForgotPasswordStep(2); // E-posta doğruysa ve mail atıldıysa 2. aşamaya geç!
    } catch (error: any) {
      setMessageType("error");
      
      if (error.message === "NOT_FOUND") {
        setMessage("Bu e-posta adresine ait kayıtlı bir hesap bulunamadı!");
      } else {
        setMessage("Mail gönderilemedi. Sunucunuzun (Backend) çalıştığından emin olun.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 ADIM 2: KODU DOĞRULAYIP YENİ ŞİFREYİ KAYDETME (GERÇEK BACKEND BAĞLANTISI)
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Şifreler birbiriyle uyuşmuyor!");
      return;
    }

    setIsLoading(true);
    setMessageType("info");
    setMessage("Şifreniz sıfırlanıyor...");

    try {
      const response = await fetch("https://unicycle-api.onrender.com/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode, newPassword: password }),
      });

      if (!response.ok) {
         if(response.status === 400) throw new Error("BAD_REQUEST");
         throw new Error("SERVER_ERROR");
      }

      setMessageType("success");
      setMessage("Şifreniz başarıyla sıfırlandı! Lütfen yeni şifrenizle giriş yapın.");
      
      setPassword("");
      setConfirmPassword("");
      setOtpCode("");
      
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotPasswordStep(1); 
        setIsLogin(true);
        setMessage("");
        setMessageType("");
      }, 2000);

    } catch (error: any) {
      setMessageType("error");
      if(error.message === "BAD_REQUEST") {
         setMessage("Girdiğiniz doğrulama kodu hatalı. Lütfen tekrar kontrol edin.");
      } else {
         setMessage("İşlem sırasında bir hata oluştu. Sunucu bağlantısını kontrol edin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessageType("info");
    setMessage("İşlem yapılıyor, lütfen bekleyin...");

    if (!isLogin) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setMessageType("error");
        setMessage("Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak tam yazın.");
        setIsLoading(false);
        return;
      }
      if (!phone.trim()) {
        setMessageType("error");
        setMessage("Güvenliğiniz için telefon numaranızı girmeniz zorunludur.");
        setIsLoading(false);
        return;
      }
      if (!studentDoc) {
        setMessageType("error");
        setMessage("Öğrenci hesabınızın onaylanabilmesi için lütfen öğrenci belgenizi yükleyin.");
        setIsLoading(false);
        return;
      }

      let finalUniversity = university;
      if (university === "Diğer...") {
        if (customUniversity.trim() === "") {
          setMessageType("error");
          setMessage("Lütfen üniversitenizin adını tam olarak yazın.");
          setIsLoading(false);
          return;
        }
        finalUniversity = customUniversity.trim();
      }

      try {
        const response = await fetch("https://unicycle-api.onrender.com/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, phone, university: finalUniversity }),
        });

        const text = await response.text();
        if (response.ok) {
          setMessageType("success");
          setMessage("Kayıt talebiniz alındı! Admin onayından sonra giriş yapabileceksiniz.");
          setFullName(""); setEmail(""); setPassword(""); setPhone(""); setCustomUniversity(""); setStudentDoc(null);
          setTimeout(() => { setIsLogin(true); setMessage(""); setMessageType(""); }, 3000);
        } else {
          setMessageType("error");
          setMessage(translateBackendMessage(text));
        }
      } catch (error) {
        setMessageType("error");
        setMessage("Sunucuya bağlanılamadı. Arka planda sunucu çalışıyor mu?");
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const response = await fetch("https://unicycle-api.onrender.com/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.status === "PENDING") {
             setMessageType("error");
             setMessage("Hesabınız henüz Admin tarafından onaylanmadı. Lütfen belgenizin incelenmesini bekleyin.");
             setIsLoading(false);
             return;
          }
          localStorage.clear();
          localStorage.setItem("user", JSON.stringify(userData));
          if (userData.university) {
            localStorage.setItem("userUni", userData.university);
          }
          setMessageType("success");
          setMessage("Giriş başarılı! Yönlendiriliyorsun...");
          setEmail(""); setPassword("");
          setTimeout(() => (window.location.href = "/profile"), 1500);
        } else {
          const errorText = await response.text();
          setMessageType("error");
          setMessage(translateBackendMessage(errorText) === "İşlem başarısız oldu. Lütfen bilgilerinizi kontrol edin." ? errorText : translateBackendMessage(errorText));
        }
      } catch (error) {
        setMessageType("error");
        setMessage("Sunucuya bağlanılamadı. Arka planda sunucu çalışıyor mu?");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spinSlow { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes spinSlowReverse { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
        .bg-grid-texture { background-size: 50px 50px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px); mask-image: radial-gradient(circle at center, black 60%, transparent 100%); }
        .sculpture-ring-1 { position: absolute; top: 50%; left: 50%; width: 550px; height: 550px; border: 3px solid rgba(32, 178, 170, 0.9); box-shadow: 0 0 20px rgba(32, 178, 170, 0.5); border-radius: 50%; animation: spinSlow 20s linear infinite; clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 0% 100%); }
        .sculpture-ring-2 { position: absolute; top: 50%; left: 50%; width: 450px; height: 450px; border: 3px solid rgba(59, 130, 246, 0.8); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); border-radius: 50%; animation: spinSlowReverse 15s linear infinite; clip-path: polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%); }
      `,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f2e36] to-slate-900 z-0"></div>
      <div className="absolute inset-0 bg-grid-texture z-0 opacity-100 mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#20B2AA] rounded-full blur-[100px] opacity-40"></div>
        <div className="sculpture-ring-1"></div>
        <div className="sculpture-ring-2"></div>
      </div>

      <div className="absolute top-8 left-8 z-50">
        <Link
          href="/"
          className="text-slate-300 hover:text-white font-bold flex items-center gap-2 transition-colors drop-shadow-md text-sm sm:text-base group focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Ana Sayfaya Dön
        </Link>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/40 my-12">
        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-6 sm:p-8 text-center border-b border-slate-100">
          <Link
            href="/"
            className="flex justify-center items-center gap-2.5 hover:scale-105 transition-transform mb-4 inline-flex focus:outline-none"
          >
            <Image
              src="/logo.jpeg"
              alt="UniCycle İkon"
              width={56}
              height={56}
              className="object-contain drop-shadow-sm rounded-xl"
              priority
            />
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {isForgotPassword
              ? "Şifreni Sıfırla"
              : isLogin
                ? "Tekrar Hoş Geldin"
                : "UniCycle'a Katıl"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">
            {isForgotPassword
              ? forgotPasswordStep === 1 
                ? "Kayıtlı e-posta adresini girerek doğrulama kodu alabilirsin."
                : "Gelen kodu ve kullanmak istediğin yeni şifreni belirle."
              : isLogin
                ? "Kampüs pazaryerine güvenle giriş yap."
                : "Öğrenci e-postan ve okulunla saniyeler içinde kayıt ol."}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-sm font-bold text-left flex items-start gap-3 shadow-sm border ${
                messageType === "success"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : messageType === "info"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {messageType === "success" && (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              {messageType === "error" && (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              {messageType === "info" && (
                <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />
              )}
              <span className="leading-snug">{message}</span>
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={
              isForgotPassword
                ? forgotPasswordStep === 1
                  ? handleSendCode
                  : handleResetPassword
                : handleSubmit
            }
          >
            {/* KAYIT EKRANI ALANLARI */}
            {!isLogin && !isForgotPassword && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    İsim ve Soyisim
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      aria-label="İsim ve Soyisim"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Örn: Feride Okur"
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:bg-white text-sm font-semibold transition-all"
                      required={!isLogin && !isForgotPassword}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      aria-label="Telefon Numarası"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:bg-white text-sm font-semibold transition-all"
                      required={!isLogin && !isForgotPassword}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Üniversiteniz
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                      aria-label="Üniversite Seçimi"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:bg-white font-semibold text-sm appearance-none cursor-pointer transition-all"
                    >
                      {UNIVERSITIES.map((uni, idx) => (
                        <option key={idx} value={uni}>
                          {uni}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {university === "Diğer..." && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[11px] sm:text-xs font-bold text-[#20B2AA] mb-1.5 uppercase tracking-wider px-1">
                      Okulunuzun Adı
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Building2 className="h-5 w-5 text-[#20B2AA]" />
                      </div>
                      <input
                        aria-label="Özel Üniversite Adı"
                        type="text"
                        value={customUniversity}
                        onChange={(e) => setCustomUniversity(e.target.value)}
                        placeholder="Örn: X Teknik Üniversitesi"
                        className="block w-full bg-[#20B2AA]/5 border border-[#20B2AA]/20 text-[#20B2AA] rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:bg-white font-bold text-sm transition-all"
                        required={!isLogin && university === "Diğer..." && !isForgotPassword}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Öğrenci Belgesi (PDF, JPG, PNG)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Upload className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      aria-label="Öğrenci Belgesi Yükle"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#20B2AA]/10 file:text-[#20B2AA] hover:file:bg-[#20B2AA]/20 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-sm transition-all cursor-pointer"
                      required={!isLogin && !isForgotPassword}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
                    Belgeniz sadece Admin onay sürecinde incelenecektir. (Maks 5MB)
                  </p>
                </div>
              </div>
            )}

            {/* ORTAK ALAN: E-POSTA GİRİŞİ */}
            {(!isForgotPassword || (isForgotPassword && forgotPasswordStep === 1)) && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                  Üniversite E-Postası
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    aria-label="E-Posta Adresi"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="isim@ogrenci.edu.tr"
                    className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-semibold transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* 🚀 AŞAMA 2: DOĞRULAMA KODU VE YENİ ŞİFRE 🚀 */}
            {isForgotPassword && forgotPasswordStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    6 Haneli Doğrulama Kodu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} // Sadece rakam!
                      placeholder="••••••"
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg font-black tracking-[0.5em] text-center transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
                    <span className="text-[#20B2AA]">{email}</span> adresine gönderildi.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold tracking-widest transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold tracking-widest transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GİRİŞ / KAYIT ŞİFRE ALANI */}
            {!isForgotPassword && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    aria-label="Şifre"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full bg-slate-100 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold tracking-widest transition-all"
                    required
                  />
                </div>

                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotPasswordStep(1); // Sıfırlama başlarken 1. aşamadan başla
                        setIsLogin(false);
                        setMessage("");
                        setMessageType("");
                        setPassword(""); // Eski şifreyi temizle
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-0"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BUTONLAR */}
            {isForgotPassword ? (
              <div className="pt-2 flex gap-3">
                {forgotPasswordStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep(1);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-14 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors focus:outline-none"
                    title="Geri Dön"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 text-white font-black text-base sm:text-lg py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Bekleyiniz...
                    </>
                  ) : forgotPasswordStep === 1 ? (
                    <>Kod Gönder <ArrowRight className="w-5 h-5" /></>
                  ) : (
                    "Şifreyi Güncelle"
                  )}
                </button>
              </div>
            ) : !isLogin ? (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 text-white font-black text-base sm:text-lg py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Bekleyiniz...
                  </>
                ) : (
                  "Hesap Oluştur"
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 text-white font-black text-base sm:text-lg py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Bekleyiniz...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            )}
          </form>

          {/* ALT GEÇİŞ BUTONLARI */}
          <div className="mt-6 text-center text-xs sm:text-sm font-medium text-slate-500 bg-slate-50 py-3.5 rounded-xl border border-slate-100">
            {isForgotPassword ? (
              <>
                Şifreni hatırladın mı?
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotPasswordStep(1);
                    setIsLogin(true);
                    setMessage("");
                    setMessageType("");
                  }}
                  className="ml-1.5 font-black text-blue-600 hover:text-[#20B2AA] transition-colors focus:outline-none focus:ring-0"
                >
                  Giriş Ekranına Dön
                </button>
              </>
            ) : isLogin ? (
              <>
                Hesabın yok mu?
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setIsForgotPassword(false);
                    setMessage("");
                    setMessageType("");
                  }}
                  className="ml-1.5 font-black text-[#20B2AA] hover:text-teal-700 transition-colors focus:outline-none focus:ring-0"
                >
                  Hemen Kayıt Ol
                </button>
              </>
            ) : (
              <>
                Zaten hesabın var mı?
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setIsForgotPassword(false);
                    setMessage("");
                    setMessageType("");
                  }}
                  className="ml-1.5 font-black text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-0"
                >
                  Giriş Yap
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}