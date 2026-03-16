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
          "http://localhost:8080/api/users/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // 🚀 YENİ: Final okulu da Java'ya paketleyip gönderiyoruz!
            body: JSON.stringify({
              fullName: fullName,
              email: email,
              password: password,
              university: finalUniversity,
            }),
          },
        );

        {/*BACKGROUND ANIMATION*/}
  
  <video
  className="absolute inset-0 w-full h-full object-cover opacity-40"
  autoPlay
  muted
  playsInline
  loop
>
  <source src="/trade.mp4" type="video/mp4" />
</video>


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
        const response = await fetch("http://localhost:8080/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem("user", JSON.stringify(userData));

          // Java'dan okul bilgisi geliyorsa onu da hafızaya kazı!
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
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <video
  autoPlay
  muted
 
  playsInline
  className="absolute inset-0 w-full h-full object-cover opacity-40"
  src="/trade.mp4"
/>

<div className="absolute inset-0 bg-black/30"></div>
      <div className="absolute top-8 left-8">
        <Link
          href="/"
          className="text-gray-400 hover:text-blue-600 font-bold flex items-center gap-2 transition-colors"
        >
          <span>←</span> Ana Sayfaya Dön
        </Link>
      </div>

      <div className="relative z-10 bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 mt-12 mb-12">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center border-b border-gray-100">
          <Link
            href="/"
            className="flex justify-center items-center gap-3 hover:scale-105 transition-transform mb-4"
          >
            <Image
              src="/logo.jpeg"
              alt="UniCycle İkon"
              width={56}
              height={56}
              className="object-contain drop-shadow-sm"
              priority
            />
            <span className="text-4xl font-extrabold tracking-tight text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-blue-900">
            {isLogin ? "Tekrar Hoş Geldin! 👋" : "UniCycle'a Katıl! 🚀"}
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            {isLogin
              ? "Kampüs pazaryerine giriş yap."
              : "Öğrenci e-postan ve okulunla saniyeler içinde kayıt ol."}
          </p>
        </div>

        <div className="p-8">
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-bold text-center ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
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
                    className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
                    required={!isLogin}
                  />
                  <p className="text-xs text-gray-400 mt-1 font-medium">
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
                    className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200 font-semibold"
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
                    <label className="block text-sm font-bold text-blue-700 mb-1.5">
                      Okulunuzun Adı
                    </label>
                    <input
                      type="text"
                      value={customUniversity}
                      onChange={(e) => setCustomUniversity(e.target.value)}
                      placeholder="Örn: X Teknik Üniversitesi"
                      className="w-full bg-blue-50 text-blue-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-blue-200 font-semibold placeholder-blue-300"
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
                className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
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
                className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-3.5 rounded-xl transition-colors shadow-md mt-4"
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
