"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function NotificationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // 🚀 İŞTE EKSİK OLAN SAYAÇ: Sadece "Okunmamış" olanları tutacak!
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      // Bildirimleri çek
      fetch(
        `https://unicycle-api.onrender.com/api/interaction/notifications/${parsedUser.id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const deletedNotifs = JSON.parse(
              localStorage.getItem(`deletedNotifs_${parsedUser.id}`) || "[]",
            );
            const seenNotifs = JSON.parse(
              localStorage.getItem(`seenNotifs_${parsedUser.id}`) || "[]",
            );

            // Silinmemiş BÜTÜN bildirimler (Ekranda listelemek için)
            const activeNotifs = data.filter(
              (n: any) => !deletedNotifs.includes(n.id),
            );
            setNotifications(activeNotifs.reverse());

            // 🚀 SADECE YENİ (Görülmemiş) OLANLARI SAY
            const unread = activeNotifs.filter(
              (n: any) => !seenNotifs.includes(n.id),
            );
            setUnreadCount(unread.length);

            // 🧠 ZEKİ DOKUNUŞ: Sayfaya girildiği an hepsini "Görüldü" olarak hafızaya al!
            const allActiveIds = activeNotifs.map((n: any) => n.id);
            localStorage.setItem(
              `seenNotifs_${parsedUser.id}`,
              JSON.stringify(allActiveIds),
            );

            // Navbar'daki zilin sayısını da anında sıfırlaması için sinyal gönder
            window.dispatchEvent(new Event("notificationsSeen"));
          }
        })
        .catch((err) => console.error("Bildirimler çekilirken hata:", err))
        .finally(() => setIsLoading(false));
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  }, [router]);

  const handleDeleteNotification = async (notificationId: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    const deletedNotifs = JSON.parse(
      localStorage.getItem(`deletedNotifs_${currentUser.id}`) || "[]",
    );
    localStorage.setItem(
      `deletedNotifs_${currentUser.id}`,
      JSON.stringify([...deletedNotifs, notificationId]),
    );
    try {
      await fetch(
        `https://unicycle-api.onrender.com/api/interaction/notifications/${notificationId}`,
        { method: "DELETE" },
      );
    } catch (err) {
      console.error("Backend silme hatası:", err);
    }
  };

  const handleClearAll = () => {
    const allIds = notifications.map((n) => n.id);
    const deletedNotifs = JSON.parse(
      localStorage.getItem(`deletedNotifs_${currentUser?.id}`) || "[]",
    );
    localStorage.setItem(
      `deletedNotifs_${currentUser?.id}`,
      JSON.stringify([...deletedNotifs, ...allIds]),
    );
    setNotifications([]);
    setUnreadCount(0); // Ekranı temizleyince sayacı da sıfırla
  };

  const getNotificationStyle = (message: string) => {
    const msg = message.toLowerCase();

    // 💖 BEĞENİ / FAVORİ
    if (msg.includes("beğen") || msg.includes("favori")) {
      return {
        icon: "💖",
        bg: "bg-pink-50",
        border: "border-pink-100",
        text: "text-pink-500",
      };
    }

    // 💬 YORUM / MESAJ
    if (msg.includes("yorum") || msg.includes("mesaj")) {
      return {
        icon: "💬",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
        text: "text-emerald-500",
      };
    }

    // 🔔 YENİ İLAN / TAKİP (Buraya "takip" kelimesini ekledik!)
    if (
      msg.includes("ilan") ||
      msg.includes("ekledi") ||
      msg.includes("takip")
    ) {
      return {
        icon: "🔔",
        bg: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-500",
      };
    }

    // ✨ DİĞER DURUMLAR
    return {
      icon: "✨",
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-500",
    };
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex justify-center items-center font-bold text-slate-500">
        Bildirimler yükleniyor...
      </div>
    );

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1000px] mx-auto px-4 h-20 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-3 hover:scale-105 transition-transform"
          >
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={45}
              height={45}
              className="rounded-md"
            />
            <span className="text-2xl font-extrabold text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.back()}
              className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-full font-bold hover:bg-slate-200 transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-4 mt-10">
        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            Bildirimler
            {/* 🚀 BURASI DÜZELDİ: Artık Bütün Listeyi Değil, Sadece OKUNMAMIŞ olanları gösteriyor! */}
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-600 text-sm font-bold py-1 px-3 rounded-full">
                {unreadCount} Yeni
              </span>
            )}
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
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <span className="text-6xl mb-4 opacity-50 drop-shadow-sm">
                📭
              </span>
              <h2 className="text-2xl font-bold text-slate-700">Tertemiz!</h2>
              <p className="text-slate-500 mt-2 font-medium">
                Şu an için hiçbir bildirimin yok.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {notifications.map((notif) => {
                const style = getNotificationStyle(notif.message);
                return (
                  <div
                    key={notif.id}
                    className="p-5 sm:p-6 flex items-start sm:items-center gap-4 hover:bg-slate-50 transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border shrink-0 shadow-sm ${style.bg} ${style.border} ${style.text}`}
                    >
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-semibold text-[15px] leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                        {notif.createdAt
                          ? new Date(notif.createdAt).toLocaleDateString(
                              "tr-TR",
                            ) +
                            " • " +
                            new Date(notif.createdAt).toLocaleTimeString(
                              "tr-TR",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "Yeni"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 border border-transparent hover:border-red-100"
                      title="Bildirimi Sil"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
