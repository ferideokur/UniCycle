"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
// 🚀 YENİ: Profesyonel Vektörel İkonlar
import {
  Bell,
  Heart,
  MessageCircle,
  Package,
  UserPlus,
  Trash2,
  ArrowLeft,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Veritabanından (SQL) güncel bildirimleri çek
      fetch(
        `https://unicycle-api.onrender.com/api/interaction/notifications/${parsedUser.id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // LocalStorage'da daha önceden silinmiş gibi görünenleri filtrele
            const deletedNotifs = JSON.parse(
              localStorage.getItem(`deletedNotifs_${parsedUser.id}`) || "[]",
            );
            const activeNotifs = data
              .filter((n: any) => !deletedNotifs.includes(n.id))
              .reverse();

            setNotifications(activeNotifs);

            // Sayfaya girildiği için okunmamış rozetini sıfırla (Tüm sayfalara sinyal gönder)
            const seenNotifs = activeNotifs.map((n: any) => n.id);
            localStorage.setItem(
              `seenNotifs_${parsedUser.id}`,
              JSON.stringify(seenNotifs),
            );
            window.dispatchEvent(new Event("notificationsSeen"));
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Bildirimler çekilemedi:", err);
          setLoading(false);
        });
    } else {
      window.location.href = "/login";
    }
  }, []);

  // 🗑️ TEK BİR BİLDİRİMİ KALICI OLARAK SİL (Veritabanından)
  const handleDelete = async (id: number) => {
    // 1. Ekrandan anında sil (Kullanıcı beklemesin)
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // 2. Tarayıcı hafızasına not et (Yedek koruma)
    const deleted = JSON.parse(
      localStorage.getItem(`deletedNotifs_${user.id}`) || "[]",
    );
    localStorage.setItem(
      `deletedNotifs_${user.id}`,
      JSON.stringify([...deleted, id]),
    );

    // 3. ARKADA JAVA'YA (VERİTABANI) SİLME İSTEĞİ GÖNDER (Kalıcı Çözüm)
    try {
      await fetch(
        `https://unicycle-api.onrender.com/api/interaction/notifications/${id}`,
        {
          method: "DELETE",
        },
      );
    } catch (err) {
      console.error("Backend'den silinemedi:", err);
    }
  };

  // 🧹 TÜMÜNÜ KALICI OLARAK TEMİZLE
  const handleClearAll = async () => {
    if (
      !window.confirm(
        "Tüm bildirimleri kalıcı olarak silmek istediğine emin misin?",
      )
    )
      return;

    const allIds = notifications.map((n) => n.id);

    // 1. Ekranı tamamen temizle
    setNotifications([]);

    // 2. Tarayıcı hafızasına not et
    const deleted = JSON.parse(
      localStorage.getItem(`deletedNotifs_${user.id}`) || "[]",
    );
    localStorage.setItem(
      `deletedNotifs_${user.id}`,
      JSON.stringify([...deleted, ...allIds]),
    );

    // 3. Veritabanından hepsini silmek için tek tek istek at
    for (const id of allIds) {
      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/interaction/notifications/${id}`,
          {
            method: "DELETE",
          },
        );
      } catch (err) {
        console.error("Toplu silme hatası:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* 🚀 ÜST MENÜ (Sade ve Temiz - Focus Mode) */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-6 pt-1 sm:pt-0">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform group cursor-pointer"
            >
              <Image
                src="/logo.jpeg"
                alt="UniCycle"
                width={44}
                height={44}
                className="object-contain bg-transparent mix-blend-multiply rounded-md sm:w-[52px] sm:h-[52px]"
                priority
              />
              <span className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-slate-800">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft size={16} /> Geri Dön
            </button>
          </div>
        </div>
      </header>

      {/* 📜 BİLDİRİM İÇERİĞİ */}
      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Bildirimler
          </h1>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors mb-1"
            >
              Tümünü Temizle
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                📭
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Her Şey Tertemiz
              </h2>
              <p className="text-slate-500 font-medium">
                Şu an için yeni bir bildirimin bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => {
                // 🚀 YENİ: Profesyonel Vektörel İkon Mantığı (Emojiler Kalktı)
                let icon = <Bell className="w-5 h-5 sm:w-6 sm:h-6" />;
                let bg = "bg-blue-50";
                let text = "text-blue-500";
                const msgLower = notif.message?.toLowerCase() || "";

                if (msgLower.includes("beğen") || msgLower.includes("favori")) {
                  icon = (
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  );
                  bg = "bg-red-50";
                  text = "text-red-500";
                } else if (
                  msgLower.includes("mesaj") ||
                  msgLower.includes("yorum") ||
                  msgLower.includes("soru")
                ) {
                  icon = <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />;
                  bg = "bg-green-50";
                  text = "text-green-500";
                } else if (msgLower.includes("takip")) {
                  icon = <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />;
                  bg = "bg-pink-50";
                  text = "text-pink-500";
                } else if (
                  msgLower.includes("ilan") ||
                  msgLower.includes("ekledi")
                ) {
                  icon = <Package className="w-5 h-5 sm:w-6 sm:h-6" />;
                  bg = "bg-orange-50";
                  text = "text-orange-500";
                }

                return (
                  <div
                    key={notif.id}
                    className="flex items-center gap-4 p-5 sm:p-6 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group"
                  >
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${bg} flex items-center justify-center ${text} shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-slate-700 leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <span>
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleDateString(
                                "tr-TR",
                              )
                            : "Bugün"}
                        </span>
                        <span>•</span>
                        <span>
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleTimeString(
                                "tr-TR",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "Yeni"}
                        </span>
                      </p>
                    </div>
                    {/* 🚀 YENİ: Vektörel Çöp Kutusu İkonu */}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 shrink-0"
                      title="Bildirimi Sil"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
