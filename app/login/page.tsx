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

// 🚀 YENİ: ARKA PLANDAN GELEN İNGİLİZCE MESAJLARI TÜRKÇEYE ÇEVİREN AKILLI FONKSİYON (GÜNCELLENDİ)
const translateBackendMessage = (msg: string) => {
  if (!msg) return "Bir hata oluştu, lütfen tekrar deneyin.";
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes("already exist") || lowerMsg.includes("taken"))
    return "Bu e-posta adresi zaten kullanımda.";
  // 🚀 "login failed" ibaresi sözlüğe eklendi!
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

  // Eğer benim öngörmediğim başka bir İngilizce kelime gelirse:
  return "İşlem başarısız oldu. Lütfen bilgilerinizi kontrol edin.";
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // HAFIZALAR (STATE)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OKUL HAFIZALARI
  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | ""
  >("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessageType("info");
    setMessage("İşlem yapılıyor, lütfen bekleyin...");

    if (!isLogin) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setMessageType("error");
        setMessage(
          "Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak tam yazın (Örn: Feride Okur).",
        );
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
        const response = await fetch(
          "https://unicycle-api.onrender.com/api/users/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              email,
              password,
              university: finalUniversity,
            }),
          },
        );

        const text = await response.text();
        if (response.ok) {
          setMessageType("success");
          setMessage("Başarıyla kayıt oldun! Lütfen giriş yap.");
          setFullName("");
          setEmail("");
          setPassword("");
          setCustomUniversity("");
          setTimeout(() => {
            setIsLogin(true);
            setMessage("");
            setMessageType("");
          }, 2000);
        } else {
          setMessageType("error");
          // 🚀 ÇEVİRMEN DEVREDE
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          },
        );

        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem("user", JSON.stringify(userData));

          if (userData.university) {
            localStorage.setItem("userUni", userData.university);
          }

          setMessageType("success");
          // 🚀 ÇEVİRMEN DEVREDE
          setMessage("Giriş başarılı! Yönlendiriliyorsun...");
          setEmail("");
          setPassword("");
          setTimeout(() => (window.location.href = "/profile"), 1500);
        } else {
          const errorText = await response.text();
          setMessageType("error");
          // 🚀 ÇEVİRMEN DEVREDE
          setMessage(translateBackendMessage(errorText));
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
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-900">
      {/* PREMIUM CİDDİ ARKA PLAN (CSS Mimari) */}
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

      {/* 1. Derinlik: Okyanus/Turkuaz Renk Katmanı */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f2e36] to-slate-900 z-0"></div>
      {/* 2. Doku: Geometrik Grid Overlay */}
      <div className="absolute inset-0 bg-grid-texture z-0 opacity-100 mix-blend-overlay"></div>
      {/* 3. Merkezi Öğe: 3D Soyut UniCycle Heykeli */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#20B2AA] rounded-full blur-[100px] opacity-40"></div>
        <div className="sculpture-ring-1"></div>
        <div className="sculpture-ring-2"></div>
      </div>

      {/* Geri Dön Butonu */}
      <div className="absolute top-8 left-8 z-50">
        <Link
          href="/"
          className="text-slate-300 hover:text-white font-bold flex items-center gap-2 transition-colors drop-shadow-md text-sm sm:text-base group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* BUZLU CAM FORM KUTUSU */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/40 my-12">
        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-6 sm:p-8 text-center border-b border-slate-100">
          <Link
            href="/"
            className="flex justify-center items-center gap-2.5 hover:scale-105 transition-transform mb-4 inline-flex"
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
            {isLogin ? "Tekrar Hoş Geldin" : "UniCycle'a Katıl"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">
            {isLogin
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

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    İsim ve Soyisim
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Örn: Feride Okur"
                      className="w-full bg-slate-50 text-slate-900 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 text-sm font-semibold transition-all"
                      required={!isLogin}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
                    Güvenlik için soyadınızı girmek zorunludur.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Üniversiteniz
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 font-semibold text-sm appearance-none cursor-pointer transition-all"
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
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-teal-500" />
                      </div>
                      <input
                        type="text"
                        value={customUniversity}
                        onChange={(e) => setCustomUniversity(e.target.value)}
                        placeholder="Örn: X Teknik Üniversitesi"
                        className="w-full bg-teal-50 text-teal-900 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-teal-200 font-bold text-sm transition-all"
                        required={!isLogin && university === "Diğer..."}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                Üniversite E-Postası
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="isim@ogrenci.edu.tr"
                  className="w-full bg-slate-50 text-slate-900 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 text-sm font-semibold transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-slate-900 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 text-sm font-bold tracking-widest transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-base sm:text-lg py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Bekleyiniz...
                </>
              ) : isLogin ? (
                "Giriş Yap"
              ) : (
                "Hesap Oluştur"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm font-medium text-slate-500 bg-slate-50 py-3.5 rounded-xl border border-slate-100">
            {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
                setMessageType("");
              }}
              className="ml-1.5 font-black text-blue-600 hover:text-[#20B2AA] transition-colors"
            >
              {isLogin ? "Hemen Kayıt Ol" : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
