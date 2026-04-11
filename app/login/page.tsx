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

  // 🚀 YENİ: OKUL HAFIZALARI
  const [university, setUniversity] = useState(UNIVERSITIES[0]); // Varsayılan ilk okul
  const [customUniversity, setCustomUniversity] = useState(""); // Diğer seçilirse

  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("İşlem yapılıyor, bekle...");

    if (!isLogin) {
      // 🛑 1. KURAL: SOYADI ZORUNLULUĞU (En az 2 kelime)
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setMessage(
          "❌ Lütfen adınızı ve soyadınızı aralarında boşluk bırakarak tam yazın (Örn: Feride Okur).",
        );
        return;
      }

      // 🛑 2. KURAL: OKUL SEÇİMİ ZORUNLULUĞU
      let finalUniversity = university;
      if (university === "Diğer...") {
        if (customUniversity.trim() === "") {
          setMessage("❌ Lütfen üniversitenizin adını tam olarak yazın.");
          return;
        }
        finalUniversity = customUniversity.trim();
      }

      // --- KAYIT OLMA (REGISTER) İŞLEMİ ---
      try {
        const response = await fetch(
          "https://unicycle-api.onrender.com/api/users/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: fullName,
              email: email,
              password: password,
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
          setTimeout(() => setIsLogin(true), 2000);
        } else {
          setMessage("❌ " + text);
        }
      } catch (error) {
        setMessage("❌ Sunucuya bağlanılamadı. Arka planda Java çalışıyor mu?");
      }
    } else {
      // --- GİRİŞ YAPMA (LOGIN) İŞLEMİ ---
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

          setMessage("✅ " + userData.message + " Yönlendiriliyorsun...");
          setEmail("");
          setPassword("");

          setTimeout(() => {
            router.push("/profile");
          }, 1500);
        } else {
          const errorText = await response.text();
          setMessage("❌ " + errorText);
        }
      } catch (error) {
        setMessage("❌ Sunucuya bağlanılamadı. Arka planda Java çalışıyor mu?");
      }
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-900">
      {/* 🚀 PREMIUM CİDDİ ARKA PLAN (CSS Mimari) */}
      {/* 🚀 PREMIUM CİDDİ ARKA PLAN (Güçlendirilmiş Parlaklık ve Kalınlık) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spinSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spinSlowReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        /* Geometrik Doku (Çok Daha Belirgin) */
        .bg-grid-texture {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
        }
        /* 3D UniCycle Heykeli (Kalın, Parlak ve Daha Büyük) */
        .sculpture-ring-1 {
          position: absolute; top: 50%; left: 50%;
          width: 550px; height: 550px;
          border: 3px solid rgba(32, 178, 170, 0.9); /* Kalın Turkuaz */
          box-shadow: 0 0 20px rgba(32, 178, 170, 0.5); /* Neon Parlaması */
          border-radius: 50%;
          animation: spinSlow 20s linear infinite;
          clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 0% 100%);
        }
        .sculpture-ring-2 {
          position: absolute; top: 50%; left: 50%;
          width: 450px; height: 450px;
          border: 3px solid rgba(59, 130, 246, 0.8); /* Kalın Mavi */
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); /* Neon Parlaması */
          border-radius: 50%;
          animation: spinSlowReverse 15s linear infinite;
          clip-path: polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%);
        }
      `,
        }}
      />

      {/* 1. Derinlik: Okyanus/Turkuaz Renk Katmanı */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f2e36] to-slate-900 z-0"></div>

      {/* 2. Doku: Geometrik Grid Overlay */}
      <div className="absolute inset-0 bg-grid-texture z-0 opacity-100 mix-blend-overlay"></div>

      {/* 3. Merkezi Öğe: 3D Soyut UniCycle Heykeli */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0">
        {/* Ortadaki parlama çok daha güçlü ve geniş */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#20B2AA] rounded-full blur-[100px] opacity-40"></div>
        {/* Dönen parlak geometrik halkalar */}
        <div className="sculpture-ring-1"></div>
        <div className="sculpture-ring-2"></div>
      </div>

      {/* Sol Üst Menü (Yazı rengi koyu zemin için açıldı) */}
      <div className="absolute top-8 left-8 z-10">
        <Link
          href="/"
          className="text-slate-400 hover:text-white font-bold flex items-center gap-2 transition-colors drop-shadow-md"
        >
          <span>←</span> Ana Sayfaya Dön
        </Link>
      </div>

      {/* BUZLU CAM (Glassmorphism) EFEKTLİ FORM KUTUSU - Ultra Premium */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/40 mt-12 mb-12">
        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-8 text-center border-b border-white/40">
          <Link
            href="/"
            className="flex justify-center items-center gap-3 hover:scale-105 transition-transform mb-4"
          >
            <Image
              src="/logo.jpeg"
              alt="UniCycle İkon"
              width={56}
              height={56}
              className="object-contain drop-shadow-sm rounded-xl"
              priority
            />
            <span className="text-4xl font-extrabold tracking-tight text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-blue-900">
            {isLogin ? "Tekrar Hoş Geldin! 👋" : "UniCycle'a Katıl! 🚀"}
          </h1>
          <p className="text-gray-600 text-sm mt-2 font-medium">
            {isLogin
              ? "Kampüs pazaryerine güvenle giriş yap."
              : "Öğrenci e-postan ve okulunla saniyeler içinde kayıt ol."}
          </p>
        </div>

        <div className="p-8">
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-bold text-center ${message.includes("✅") ? "bg-green-100/90 text-green-700" : "bg-red-100/90 text-red-700"}`}
            >
              {message}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                {/* 🚀 İSİM SOYİSİM */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    İsim ve Soyisim
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Örn: Feride Okur"
                    className="w-full bg-white/70 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
                    required={!isLogin}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Güvenlik için soyadınızı girmek zorunludur.
                  </p>
                </div>

                {/* 🚀 ÜNİVERSİTE SEÇİMİ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Üniversiteniz
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-white/70 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200 font-semibold"
                  >
                    {UNIVERSITIES.map((uni, idx) => (
                      <option key={idx} value={uni}>
                        {uni}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EĞER "DİĞER" SEÇİLİRSE GÖZÜKEN KUTU */}
                {university === "Diğer..." && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                      <span className="text-[#20B2AA]">↳</span> Lütfen
                      Okulunuzun Adını Yazın
                    </label>
                    <input
                      type="text"
                      value={customUniversity}
                      onChange={(e) => setCustomUniversity(e.target.value)}
                      placeholder="Örn: X Teknik Üniversitesi"
                      className="w-full bg-white/70 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] transition-all border border-gray-200 font-semibold shadow-sm"
                      required={!isLogin && university === "Diğer..."}
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Üniversite E-Postası
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="isim@ogrenci.edu.tr"
                className="w-full bg-white/70 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/70 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-3.5 rounded-xl transition-colors shadow-lg mt-4"
            >
              {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
              className="ml-1.5 font-black text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin ? "Hemen Kayıt Ol" : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
