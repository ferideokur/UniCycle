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
  ArrowRight,
  X,
  Eye,        // 🚀 YENİ EKLENDİ
  EyeOff,     // 🚀 YENİ EKLENDİ
} from "lucide-react";

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

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result as string);
    fileReader.onerror = (error) => reject(error);
  });
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [studentDoc, setStudentDoc] = useState<File | null>(null);

  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");

  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | ""
  >("");
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVIPSuccess, setShowVIPSuccess] = useState(false);

  // 🚀 ŞİFRE GÖSTER/GİZLE STATE'LERİ EKLENDİ
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearError = (field: string) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Lütfen geçerli bir e-posta adresi giriniz.";
    }

    if (!isLogin && !isForgotPassword) {
      if (fullName.trim().split(/\s+/).length < 2) {
        newErrors.fullName = "Lütfen adınızı ve soyadınızı tam yazınız.";
      }

      const phoneRegex = /^05[345][0-9]{8}$/;
      const cleanPhone = phone.replace(/\s+/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone =
          "Lütfen geçerli bir numara giriniz (Örn: 053X, 054X, 055X).";
      }

      if (university === "Diğer..." && !customUniversity.trim()) {
        newErrors.customUniversity = "Lütfen okulunuzun adını giriniz.";
      }

      if (!studentDoc) {
        newErrors.studentDoc =
          "Öğrenci hesabınızın onaylanması için belge yüklemelisiniz.";
      }

      if (password.length < 6) {
        newErrors.password = "Şifreniz en az 6 karakter olmalıdır.";
      }
    }

    if (isLogin && !isForgotPassword) {
      if (!password) {
        newErrors.password = "Lütfen şifrenizi giriniz.";
      }
    }

    if (isForgotPassword && forgotPasswordStep === 2) {
      if (otpCode.length !== 6) newErrors.otpCode = "Kod 6 haneli olmalıdır.";
      if (password.length < 6)
        newErrors.password = "Yeni şifreniz en az 6 karakter olmalıdır.";
      if (password !== confirmPassword)
        newErrors.confirmPassword = "Şifreler birbiriyle eşleşmiyor!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        setErrors({
          ...errors,
          studentDoc:
            "Lütfen sadece PDF, JPG veya PNG formatında bir belge yükleyin.",
        });
        e.target.value = "";
        setStudentDoc(null);
        return;
      }

      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setErrors({
          ...errors,
          studentDoc:
            "Belgenizin boyutu çok büyük. Lütfen 5MB'dan daha küçük bir dosya yükleyin.",
        });
        e.target.value = "";
        setStudentDoc(null);
        return;
      }

      setStudentDoc(file);
      clearError("studentDoc");
    } else {
      setStudentDoc(null);
    }
  };

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessageType("info");
    setMessage("E-posta adresiniz kontrol ediliyor ve kod gönderiliyor...");

    try {
      const response = await fetch(
        `https://unicycle-api.onrender.com/api/users/forgot-password?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Bu e-posta adresine ait kayıtlı bir hesap bulunamadı!",
        );
      }

      const data = await response.json();
      const generatedOtp = data.otp;

      const mailResponse = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: generatedOtp }),
      });

      if (!mailResponse.ok) {
        throw new Error("Mail gönderilemedi. Vercel sunucusunda hata oluştu.");
      }

      setMessageType("success");
      setMessage("Doğrulama maili e-postanıza başarıyla gönderildi!");
      setForgotPasswordStep(2);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessageType("info");
    setMessage("Şifreniz sıfırlanıyor...");

    try {
      const response = await fetch(
        "https://unicycle-api.onrender.com/api/users/reset-password",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otpCode, newPassword: password }),
        },
      );

      if (!response.ok) {
        if (response.status === 400) throw new Error("BAD_REQUEST");
        throw new Error("SERVER_ERROR");
      }

      setMessageType("success");
      setMessage(
        "Şifreniz başarıyla sıfırlandı! Lütfen yeni şifrenizle giriş yapın.",
      );

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
      if (error.message === "BAD_REQUEST") {
        setMessage(
          "Girdiğiniz doğrulama kodu hatalı. Lütfen tekrar kontrol edin.",
        );
      } else {
        setMessage(
          "İşlem sırasında bir hata oluştu. Sunucu bağlantısını kontrol edin.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessageType("info");
    setMessage("İşlem yapılıyor, lütfen bekleyin...");

    if (!isLogin) {
      let finalUniversity = university;
      if (university === "Diğer...") {
        finalUniversity = customUniversity.trim();
      }

      try {
        let base64Document = "";
        try {
          base64Document = await convertToBase64(studentDoc as File);
        } catch (error) {
          setMessageType("error");
          setMessage(
            "Belge yüklenirken bir sorun oluştu, lütfen tekrar deneyin.",
          );
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          "https://unicycle-api.onrender.com/api/users/register",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName,
              email,
              password,
              phone,
              university: finalUniversity,
              documentBase64: base64Document,
            }),
          },
        );

        const text = await response.text();
        if (response.ok) {
          setMessageType("");
          setMessage("");
          setShowVIPSuccess(true);

          setFullName("");
          setEmail("");
          setPassword("");
          setPhone("");
          setCustomUniversity("");
          setStudentDoc(null);

          setTimeout(() => {
            setShowVIPSuccess(false);
            setIsLogin(true);
          }, 4500);
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
        const response = await fetch(
          "https://unicycle-api.onrender.com/api/users/login",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          },
        );

        if (response.ok) {
          const userData = await response.json();
          if (userData.status === "PENDING") {
            setMessageType("error");
            setMessage(
              "Hesabınız henüz Admin tarafından onaylanmadı. Lütfen belgenizin incelenmesini bekleyin.",
            );
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
          setEmail("");
          setPassword("");
          setTimeout(() => (window.location.href = "/profile"), 1500);
        } else {
          const errorText = await response.text();
          setMessageType("error");
          setMessage(
            translateBackendMessage(errorText) ===
              "İşlem başarısız oldu. Lütfen bilgilerinizi kontrol edin."
              ? errorText
              : translateBackendMessage(errorText),
          );
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
        @keyframes successPop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .bg-grid-texture { background-size: 50px 50px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px); mask-image: radial-gradient(circle at center, black 60%, transparent 100%); }
        .sculpture-ring-1 { position: absolute; top: 50%; left: 50%; width: 550px; height: 550px; border: 3px solid rgba(32, 178, 170, 0.9); box-shadow: 0 0 20px rgba(32, 178, 170, 0.5); border-radius: 50%; animation: spinSlow 20s linear infinite; clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 0% 100%); }
        .sculpture-ring-2 { position: absolute; top: 50%; left: 50%; width: 450px; height: 450px; border: 3px solid rgba(59, 130, 246, 0.8); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); border-radius: 50%; animation: spinSlowReverse 15s linear infinite; clip-path: polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%); }
        .animate-pop { animation: successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
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

      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-50">
        <Link
          href="/"
          className="text-slate-200 hover:text-white font-bold flex items-center gap-2 transition-all drop-shadow-md text-sm sm:text-base group focus:outline-none bg-slate-900/40 sm:bg-transparent px-4 py-2 sm:p-0 rounded-full sm:rounded-none backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-none hover:bg-slate-800/60 sm:hover:bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
          Ana Sayfaya Dön
        </Link>
      </div>

      {showVIPSuccess && (
        <div className="fixed inset-0 z-[99999] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center animate-pop shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-8 shrink-0">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f2e36] tracking-tight animate-in slide-in-from-bottom-4 duration-500 delay-100 text-center">
            Aramıza Hoş Geldin!
          </h2>
          <p className="text-slate-800 mt-4 text-sm sm:text-base font-bold animate-in slide-in-from-bottom-4 duration-500 delay-200 text-center px-6 max-w-md leading-relaxed">
            Kayıt talebiniz başarıyla alındı.
            <br />
            Admin onayından hemen sonra giriş yapabilirsiniz.
          </p>
          <div className="mt-8 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <Loader2 className="w-8 h-8 text-[#20B2AA] animate-spin opacity-80" />
            <button
              onClick={() => setShowVIPSuccess(false)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold transition-all shadow-sm focus:outline-none"
            >
              <X className="w-5 h-5" /> Kapat
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/40 my-12 transition-all duration-500 ease-in-out">
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
                : "E-postan ve okulunla saniyeler içinde kayıt ol."} 
                {/* 🚀 DEĞİŞTİRİLDİ */}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-sm font-bold text-left flex items-start gap-3 shadow-sm border animate-in fade-in slide-in-from-top-2 ${
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
            noValidate
            onSubmit={
              isForgotPassword
                ? forgotPasswordStep === 1
                  ? handleSendCode
                  : handleResetPassword
                : handleSubmit
            }
          >
            {!isLogin && !isForgotPassword && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    İsim ve Soyisim
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <User
                        className={`h-5 w-5 transition-colors duration-300 ${errors.fullName ? "text-red-400" : "text-slate-400 group-focus-within:text-[#20B2AA]"}`}
                      />
                    </div>
                    <input
                      aria-label="İsim ve Soyisim"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearError("fullName");
                      }}
                      placeholder="Örn: Feride Okur"
                      className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 text-sm font-semibold transition-all duration-300 ${
                        errors.fullName
                          ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                          : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-[#20B2AA] focus:ring-[#20B2AA]/20"
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Telefon Numarası
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <Phone
                        className={`h-5 w-5 transition-colors duration-300 ${errors.phone ? "text-red-400" : "text-slate-400 group-focus-within:text-[#20B2AA]"}`}
                      />
                    </div>
                    <input
                      aria-label="Telefon Numarası"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError("phone");
                      }}
                      placeholder="05XX XXX XX XX"
                      className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 text-sm font-semibold transition-all duration-300 ${
                        errors.phone
                          ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                          : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-[#20B2AA] focus:ring-[#20B2AA]/20"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Üniversiteniz
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-[#20B2AA] transition-colors duration-300" />
                    </div>
                    <select
                      aria-label="Üniversite Seçimi"
                      value={university}
                      onChange={(e) => {
                        setUniversity(e.target.value);
                        clearError("customUniversity");
                      }}
                      className="block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 text-sm font-semibold transition-all duration-300 bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-[#20B2AA] focus:ring-[#20B2AA]/20 appearance-none cursor-pointer"
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
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                        <Building2
                          className={`h-5 w-5 transition-colors duration-300 ${errors.customUniversity ? "text-red-400" : "text-[#20B2AA]"}`}
                        />
                      </div>
                      <input
                        aria-label="Özel Üniversite Adı"
                        type="text"
                        value={customUniversity}
                        onChange={(e) => {
                          setCustomUniversity(e.target.value);
                          clearError("customUniversity");
                        }}
                        placeholder="Örn: X Teknik Üniversitesi"
                        className={`block w-full border text-[#20B2AA] rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 font-bold text-sm transition-all duration-300 ${
                          errors.customUniversity
                            ? "bg-red-50/50 border-red-400 text-slate-900 focus:ring-red-400/20"
                            : "bg-[#20B2AA]/5 border-[#20B2AA]/30 focus:border-[#20B2AA] focus:bg-white focus:ring-[#20B2AA]/20"
                        }`}
                      />
                    </div>
                    {errors.customUniversity && (
                      <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                        {errors.customUniversity}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Öğrenci Belgesi (PDF, JPG, PNG)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <Upload
                        className={`h-5 w-5 transition-colors duration-300 ${errors.studentDoc ? "text-red-400" : "text-slate-400 group-focus-within:text-[#20B2AA]"}`}
                      />
                    </div>
                    <input
                      aria-label="Öğrenci Belgesi Yükle"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                      className={`block w-full border text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#20B2AA]/10 file:text-[#20B2AA] hover:file:bg-[#20B2AA]/20 file:transition-colors file:cursor-pointer rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-4 text-sm transition-all duration-300 cursor-pointer ${
                        errors.studentDoc
                          ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                          : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-[#20B2AA] focus:ring-[#20B2AA]/20"
                      }`}
                    />
                  </div>
                  {errors.studentDoc ? (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                      {errors.studentDoc}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
                      Belgeniz sadece Admin onay sürecinde incelenecektir. (Maks 5MB)
                    </p>
                  )}
                </div>
              </div>
            )}

            {(!isForgotPassword ||
              (isForgotPassword && forgotPasswordStep === 1)) && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                  E-Posta {/* 🚀 DEĞİŞTİRİLDİ */}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                    <Mail
                      className={`h-5 w-5 transition-colors duration-300 ${errors.email ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"}`}
                    />
                  </div>
                  <input
                    aria-label="E-Posta Adresi"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                    placeholder="isim@gmail.com" /* 🚀 DEĞİŞTİRİLDİ */
                    className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 text-sm font-semibold transition-all duration-300 ${
                      errors.email
                        ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                        : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                    {errors.email}
                  </p>
                )}
              </div>
            )}

            {isForgotPassword && forgotPasswordStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    6 Haneli Doğrulama Kodu
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <KeyRound
                        className={`h-5 w-5 transition-colors duration-300 ${errors.otpCode ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"}`}
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
                        clearError("otpCode");
                      }}
                      placeholder="••••••"
                      className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 text-lg font-black tracking-widest text-center transition-all duration-300 ${
                        errors.otpCode
                          ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                          : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                  </div>
                  {errors.otpCode ? (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 text-center animate-in fade-in">
                      {errors.otpCode}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
                      <span className="text-blue-500">{email}</span> adresine
                      gönderildi.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Yeni Şifre
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <Lock
                        className={`h-5 w-5 transition-colors duration-300 ${errors.password ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"}`}
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"} // 🚀 DEĞİŞTİRİLDİ
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError("password");
                        clearError("confirmPassword");
                      }}
                      placeholder="••••••••"
                      className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:ring-4 text-sm font-bold tracking-widest transition-all duration-300 ${
                        errors.password
                          ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                          : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                    {/* 🚀 GÖZ İKONU EKLENDİ */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                      <Lock
                        className={`h-5 w-5 transition-colors duration-300 ${errors.confirmPassword ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"}`}
                      />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"} // 🚀 DEĞİŞTİRİLDİ
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError("confirmPassword");
                      }}
                      placeholder="••••••••"
                      className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:ring-4 text-sm font-bold tracking-widest transition-all duration-300 ${
                        errors.confirmPassword
                          ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                          : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                    {/* 🚀 GÖZ İKONU EKLENDİ */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isForgotPassword && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                  Şifre
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300">
                    <Lock
                      className={`h-5 w-5 transition-colors duration-300 ${errors.password ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-500"}`}
                    />
                  </div>
                  <input
                    aria-label="Şifre"
                    type={showPassword ? "text" : "password"} // 🚀 DEĞİŞTİRİLDİ
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    placeholder="••••••••"
                    className={`block w-full border text-slate-900 rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:ring-4 text-sm font-bold tracking-widest transition-all duration-300 ${
                      errors.password
                        ? "bg-red-50/50 border-red-400 focus:ring-red-400/20"
                        : "bg-slate-50 hover:bg-slate-100 focus:bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  />
                  {/* 🚀 GÖZ İKONU EKLENDİ */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1.5 px-1 animate-in fade-in">
                    {errors.password}
                  </p>
                )}

                {isLogin && (
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      aria-label="Şifremi Unuttum"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotPasswordStep(1);
                        setIsLogin(false);
                        setMessage("");
                        setMessageType("");
                        setErrors({});
                        setPassword("");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-0"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                )}
              </div>
            )}

            {isForgotPassword ? (
              <div className="pt-2 flex gap-3">
                {forgotPasswordStep === 2 && (
                  <button
                    type="button"
                    aria-label="Geri Dön"
                    onClick={() => {
                      setForgotPasswordStep(1);
                      setPassword("");
                      setConfirmPassword("");
                      setErrors({});
                    }}
                    className="w-[60px] flex items-center justify-center bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 active:scale-[0.96] transition-all focus:outline-none mt-6"
                    title="Geri Dön"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 w-full flex justify-center items-center gap-2 text-white font-black text-base sm:text-lg py-4 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Bekleyiniz...
                    </>
                  ) : forgotPasswordStep === 1 ? (
                    "Kod Gönder"
                  ) : (
                    "Şifreyi Güncelle"
                  )}
                </button>
              </div>
            ) : !isLogin ? (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 text-white font-black text-base sm:text-lg py-4 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_rgba(32,178,170,0.25)] hover:shadow-[0_6px_20px_rgba(32,178,170,0.35)] active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-[#20B2AA] hover:bg-[#1a958e] focus:outline-none focus:ring-4 focus:ring-[#20B2AA]/30"
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
                className="w-full flex justify-center items-center gap-2 text-white font-black text-base sm:text-lg py-4 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
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

          <div className="mt-8 text-center text-xs sm:text-sm font-semibold text-slate-500 bg-slate-50/80 py-4 rounded-2xl border border-slate-100">
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
                    setErrors({});
                  }}
                  className="ml-1.5 font-black text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-0"
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
                    setErrors({});
                  }}
                  className="ml-1.5 font-black text-[#20B2AA] hover:text-[#1a958e] transition-colors focus:outline-none focus:ring-0"
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
                    setErrors({});
                  }}
                  className="ml-1.5 font-black text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-0"
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