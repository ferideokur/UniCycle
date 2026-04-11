"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// 🎓 Türkiye'deki Üniversiteler Listesi
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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // 🧠 HAFIZALAR (STATE)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🚀 OKUL HAFIZALARI
  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("⏳ İşlem yapılıyor, lütfen bekleyin...");

    if (!isLogin) {
      // 🛑 1. KURAL: SOYADI ZORUNLULUĞU
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setMessage(
          "❌ Lütfen adınızı ve soyadınızı tam yazın (Örn: Feride Okur).",
        );
        setIsLoading(false);
        return;
      }

      // 🛑 2. KURAL: OKUL SEÇİMİ
      let finalUniversity = university;
      if (university === "Diğer...") {
        if (customUniversity.trim() === "") {
          setMessage("❌ Lütfen üniversitenizin adını yazın.");
          setIsLoading(false);
          return;
        }
        finalUniversity = customUniversity.trim();
      }

      // --- KAYIT OLMA (CANLI ADRES) ---
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
          setMessage("✅ " + text);
          setFullName("");
          setEmail("");
          setPassword("");
          setCustomUniversity("");
          setTimeout(() => {
            setIsLogin(true);
            setMessage("");
          }, 2000);
        } else {
          setMessage("❌ " + text);
        }
      } catch (error) {
        setMessage("❌ Sunucuya bağlanılamadı.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- GİRİŞ YAPMA (CANLI ADRES) ---
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
          if (userData.university)
            localStorage.setItem("userUni", userData.university);
          setMessage("✅ Giriş başarılı! Yönlendiriliyorsun...");
          setTimeout(() => router.push("/profile"), 1500);
        } else {
          const errorText = await response.text();
          setMessage("❌ " + errorText);
        }
      } catch (error) {
        setMessage("❌ Sunucuya bağlanılamadı.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden bg-slate-900 w-full">
      {/* 🎬 ARKA PLAN VİDEOSU VE KARARTMA */}
      <video
        autoPlay
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
      >
        <source src="/trade.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80 z-0"></div>

      {/* 🚀 GERİ DÖN BUTONU */}
      <div className="absolute top-6 left-4 sm:top-8 sm:left-8 z-50">
        <Link
          href="/"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-white/20 hover:scale-105 transition-all text-xs sm:text-sm shadow-xl"
        >
          <span>&larr;</span> Ana Sayfaya Dön
        </Link>
      </div>

      {/* 💼 GİRİŞ / KAYIT KARTI */}
      <div className="relative z-10 bg-white w-full max-w-[420px] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden border border-white/20 my-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-gradient-to-b from-blue-50/80 to-white p-6 sm:p-8 text-center border-b border-slate-100">
          <Link
            href="/"
            className="flex justify-center items-center gap-2.5 hover:scale-105 transition-transform mb-4 inline-flex"
          >
            <Image
              src="/logo.jpeg"
              alt="UniCycle İkon"
              width={52}
              height={52}
              className="object-contain drop-shadow-sm rounded-[12px]"
              priority
            />
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {isLogin ? "Tekrar Hoş Geldin! 👋" : "UniCycle'a Katıl! 🚀"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium px-2 leading-relaxed">
            {isLogin
              ? "Kampüs pazar yerine hızlıca giriş yap."
              : "Öğrenci e-postan ve okulunla saniyeler içinde kayıt ol."}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs sm:text-sm font-bold text-center animate-in fade-in slide-in-from-top-2 ${message.includes("✅") ? "bg-green-50 text-green-600 border border-green-100" : message.includes("⏳") ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-red-50 text-red-600 border border-red-100"}`}
            >
              {message}
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    İsim ve Soyisim
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Örn: Feride Okur"
                    className="w-full bg-slate-50 text-slate-900 rounded-xl sm:rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 text-sm font-semibold"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                    Üniversiteniz
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl sm:rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 font-semibold text-sm appearance-none cursor-pointer"
                  >
                    {UNIVERSITIES.map((uni, idx) => (
                      <option key={idx} value={uni}>
                        {uni}
                      </option>
                    ))}
                  </select>
                </div>
                {university === "Diğer..." && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[11px] sm:text-xs font-bold text-[#20B2AA] mb-1.5 uppercase tracking-wider px-1">
                      Okulunuzun Adı
                    </label>
                    <input
                      type="text"
                      value={customUniversity}
                      onChange={(e) => setCustomUniversity(e.target.value)}
                      placeholder="Örn: X Teknik Üniversitesi"
                      className="w-full bg-teal-50 text-teal-900 rounded-xl sm:rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-teal-200 font-bold text-sm"
                      required={!isLogin && university === "Diğer..."}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                Üniversite E-Postası
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="isim@ogrenci.edu.tr"
                className="w-full bg-slate-50 text-slate-900 rounded-xl sm:rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider px-1">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 text-slate-900 rounded-xl sm:rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-slate-200 text-sm font-bold tracking-widest"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-[#20B2AA] hover:from-blue-700 hover:to-teal-600 disabled:opacity-70 text-white font-black text-base sm:text-lg py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 mt-4"
            >
              {isLoading
                ? "⏳ Bekleyiniz..."
                : isLogin
                  ? "Giriş Yap"
                  : "Hesap Oluştur"}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm font-medium text-slate-500 bg-slate-50 py-3.5 rounded-xl border border-slate-100">
            {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
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
