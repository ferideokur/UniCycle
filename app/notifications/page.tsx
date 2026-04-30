"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  MessageCircle,
  Package,
  UserPlus,
  Trash2,
  Search,
} from "lucide-react";

// 🚀 İsimleri her yerde büyük harfle başlatan formül
const formatName = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🚀 Premium Navbar State'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // 📜 Footer Bilgi Modalı State'leri
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({ isOpen: false, title: "", content: "" });
  const openInfoModal = (title: string, content: string) =>
    setInfoModal({ isOpen: true, title, content });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Veritabanından güncel bildirimleri çek
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

            const activeNotifs = data
              .filter((n: any) => !deletedNotifs.includes(n.id))
              .reverse();

            const unreadNotifs = activeNotifs.filter(
              (n: any) => !seenNotifs.includes(n.id),
            );

            setNotifications(activeNotifs);
            setNotificationsList(activeNotifs);
            setNotificationsCount(unreadNotifs.length);

            // Sayfaya girildiği için okunmamış rozetini sıfırla
            const newSeenNotifs = activeNotifs.map((n: any) => n.id);
            localStorage.setItem(
              `seenNotifs_${parsedUser.id}`,
              JSON.stringify(newSeenNotifs),
            );
            window.dispatchEvent(new Event("notificationsSeen"));
            setNotificationsCount(0); // Bu sayfada zaten gördü
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

  // 🚀 Premium Arama Motoru
  useEffect(() => {
    const fetchLive = async () => {
      if (searchTerm.trim().length < 2) {
        setLiveResults([]);
        return;
      }
      try {
        const isUserSearch = searchTerm.startsWith("@");
        const query = isUserSearch
          ? searchTerm.substring(1).trim()
          : searchTerm.trim();
        if (!query) return;

        let combined: { type: "user" | "product"; item: any }[] = [];

        if (isUserSearch) {
          const userRes = await fetch(
            `https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(query)}`,
          );
          if (userRes.ok) {
            const users = await userRes.json();
            if (Array.isArray(users))
              combined = users.map((u: any) => ({ type: "user", item: u }));
          }
        } else {
          const prodRes = await fetch(
            `https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(query)}`,
          );
          if (prodRes.ok) {
            const products = await prodRes.json();
            if (Array.isArray(products)) {
              products.sort((a: any, b: any) => b.id - a.id);
              combined = products.map((p: any) => ({
                type: "product",
                item: p,
              }));
            }
          }
        }

        const uniqueLive = combined.filter(
          (v: any, i: number, a: any[]) =>
            a.findIndex((v2: any) => {
              if (v.type === "user" && v2.type === "user") {
                return (
                  v2.item.id === v.item.id ||
                  (v2.item.fullName &&
                    v.item.fullName &&
                    v2.item.fullName.toLowerCase() ===
                      v.item.fullName.toLowerCase())
                );
              }
              return v2.type === v.type && v2.item.id === v.item.id;
            }) === i,
        );

        setLiveResults(uniqueLive);
      } catch (error) {
        console.error(error);
      }
    };
    const timer = setTimeout(() => fetchLive(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      setIsDropdownOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/users/${user.id}/logout`,
          { method: "POST" },
        );
      } catch (e) {}
    }
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const handleDelete = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const deleted = JSON.parse(
      localStorage.getItem(`deletedNotifs_${user.id}`) || "[]",
    );
    localStorage.setItem(
      `deletedNotifs_${user.id}`,
      JSON.stringify([...deleted, id]),
    );
    try {
      await fetch(
        `https://unicycle-api.onrender.com/api/interaction/notifications/${id}`,
        { method: "DELETE" },
      );
    } catch (err) {}
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "Tüm bildirimleri kalıcı olarak silmek istediğine emin misin?",
      )
    )
      return;
    const allIds = notifications.map((n) => n.id);
    setNotifications([]);
    const deleted = JSON.parse(
      localStorage.getItem(`deletedNotifs_${user.id}`) || "[]",
    );
    localStorage.setItem(
      `deletedNotifs_${user.id}`,
      JSON.stringify([...deleted, ...allIds]),
    );
    for (const id of allIds) {
      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/interaction/notifications/${id}`,
          { method: "DELETE" },
        );
      } catch (err) {}
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col w-full overflow-x-hidden">
      {/* 🚀 ÜST MENÜ NAVBAR (Premium İkiz) */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-6 pt-1 sm:pt-0">
            <div className="flex-shrink-0">
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
            </div>

            {/* ✨ PREMIUM ARAMA ÇUBUĞU (Masaüstü) */}
            <div className="hidden md:flex flex-1 max-w-2xl relative group z-50 px-6 lg:px-10 mx-auto">
              <form
                onSubmit={handleSearchSubmit}
                className="w-full relative flex items-center"
              >
                <input
                  type="text"
                  placeholder="Ürün, @üye veya ders notu ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-800 rounded-full py-3 px-6 pl-12 focus:outline-none focus:ring-4 focus:ring-[#20B2AA]/20 focus:bg-white border border-transparent focus:border-[#20B2AA]/30 transition-all duration-300 font-semibold text-sm shadow-inner"
                />
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#20B2AA] transition-colors pointer-events-none" />
                <button type="submit" className="hidden">
                  Ara
                </button>
              </form>

              {isDropdownOpen && liveResults.length > 0 && (
                <div className="absolute top-full left-6 right-10 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                  {liveResults.slice(0, 5).map((result, idx) => (
                    <Link
                      href={
                        result.type === "user"
                          ? `/user/${result.item.id}`
                          : `/listing-detail/${result.item.id}`
                      }
                      key={idx}
                      className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                        {result.type === "user"
                          ? formatName(result.item.fullName).charAt(0)
                          : "📦"}
                      </div>
                      <div className="font-bold text-slate-800 text-sm capitalize">
                        {formatName(result.item.fullName) || result.item.title}
                      </div>
                    </Link>
                  ))}
                  <div
                    className="px-5 py-2.5 border-t border-slate-100 text-center bg-slate-50 mt-1 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={handleSearchSubmit}
                  >
                    <span className="text-xs font-bold text-blue-600">
                      Tüm sonuçları gör &rarr;
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
              <Link
                href="/create-listing"
                className="hidden md:flex font-black text-[#20B2AA] hover:text-teal-700 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-4 relative">
                  <Link
                    href="/favorites"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 transition-all rounded-full flex items-center justify-center border border-slate-200 shadow-sm group shrink-0"
                    title="Favorilerim"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </Link>

                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 transition-all rounded-full flex items-center justify-center border border-slate-200 shadow-sm group shrink-0"
                      title="Bildirimler"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        ></path>
                      </svg>
                      {notificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-md">
                          {notificationsCount}
                        </span>
                      )}
                    </button>
                    {isNotificationOpen && (
                      <div className="absolute top-full right-[-50px] sm:right-0 mt-3 w-[300px] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <span className="font-bold text-slate-800">
                            Bildirimler
                          </span>
                          {notificationsCount > 0 && (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {notificationsCount} Yeni
                            </span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                          {notificationsList.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500 text-sm font-medium">
                              Şu an hiç bildirimin yok.
                            </div>
                          ) : (
                            notificationsList.slice(0, 5).map((notif: any) => {
                              let icon = <Bell className="w-5 h-5" />;
                              let bg = "bg-blue-50";
                              let text = "text-blue-500";
                              const msgLower =
                                notif.message?.toLowerCase() || "";
                              if (
                                msgLower.includes("beğen") ||
                                msgLower.includes("favori")
                              ) {
                                icon = (
                                  <Heart className="w-5 h-5 fill-current" />
                                );
                                bg = "bg-red-50";
                                text = "text-red-500";
                              } else if (
                                msgLower.includes("mesaj") ||
                                msgLower.includes("yorum") ||
                                msgLower.includes("soru")
                              ) {
                                icon = <MessageCircle className="w-5 h-5" />;
                                bg = "bg-green-50";
                                text = "text-green-500";
                              } else if (msgLower.includes("takip")) {
                                icon = <UserPlus className="w-5 h-5" />;
                                bg = "bg-pink-50";
                                text = "text-pink-500";
                              } else if (
                                msgLower.includes("ilan") ||
                                msgLower.includes("ekledi")
                              ) {
                                icon = <Package className="w-5 h-5" />;
                                bg = "bg-orange-50";
                                text = "text-orange-500";
                              }

                              // 🚀 YENİ: BİLDİRİM AÇILIR MENÜSÜ İÇİNDEKİ İSİMLER DE BÜYÜDÜ
                              const parts = notif.message.split(",");
                              const formattedMessage =
                                parts.length > 1
                                  ? `${formatName(parts[0])},${parts.slice(1).join(",")}`
                                  : formatName(notif.message);

                              return (
                                <div
                                  key={notif.id}
                                  className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex gap-3 items-center group"
                                >
                                  <div
                                    className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${text} shrink-0 transition-transform group-hover:scale-105`}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700 leading-snug font-semibold">
                                      {formattedMessage}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                      {notif.createdAt
                                        ? new Date(
                                            notif.createdAt,
                                          ).toLocaleDateString("tr-TR")
                                        : "Yeni"}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <Link
                          href="/notifications"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block w-full text-center px-4 py-3 bg-slate-50 text-xs font-bold text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          Tüm Bildirimleri Gör &rarr;
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-bold shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <div className="w-5 h-5 sm:w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
                      👤
                    </div>
                    <span className="hidden sm:block text-sm">Hesabım</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-1 sm:ml-2 flex items-center justify-center group"
                    title="Çıkış Yap"
                  >
                    <span className="hidden sm:block font-bold text-sm">
                      Çıkış
                    </span>
                    <svg
                      className="w-[22px] h-[22px] sm:hidden group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      ></path>
                    </svg>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center bg-slate-800 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold hover:bg-black transition-colors text-sm shrink-0"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 📱 MOBİL ARAMA ÇUBUĞU */}
        <div className="md:hidden pb-3 pt-2 w-full relative z-40 px-4 bg-white border-t border-slate-50 shadow-sm">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full relative flex items-center"
          >
            <input
              type="text"
              placeholder="Ürün veya @üye ara..."
              className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-800 rounded-full py-2.5 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/30 border border-transparent transition-all font-semibold text-sm shadow-inner"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <button type="submit" className="hidden">
              Ara
            </button>
          </form>
          {isDropdownOpen && liveResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
              {liveResults.slice(0, 4).map((result, idx) => (
                <Link
                  href={
                    result.type === "user"
                      ? `/user/${result.item.id}`
                      : `/listing-detail/${result.item.id}`
                  }
                  key={`mob-${idx}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 border-b border-slate-50"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden flex shrink-0 items-center justify-center">
                    {result.type === "user" ? (
                      <span className="font-bold text-blue-600">
                        {formatName(result.item.fullName || "U").charAt(0)}
                      </span>
                    ) : (
                      <span className="text-xs">📦</span>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-bold text-slate-800 truncate text-xs capitalize">
                      {formatName(result.item.fullName) || result.item.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 📜 BİLDİRİM İÇERİĞİ */}
      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
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

                // 🚀 YENİ: BİLDİRİM SAYFASINDAKİ İSİMLER DE BÜYÜDÜ
                // Virgül varsa ilk kelimeyi büyük harf yap
                const parts = notif.message.split(",");
                const formattedMessage =
                  parts.length > 1
                    ? `${formatName(parts[0])},${parts.slice(1).join(",")}`
                    : formatName(notif.message);

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
                        {formattedMessage}
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

      {/* 📜 FOOTER BİLGİ POP-UP'I (MODAL) */}
      {infoModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                {infoModal.title}
              </h2>
              <button
                onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                className="text-slate-400 hover:text-red-500 text-2xl font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 sm:p-8 text-sm sm:text-base text-slate-600 font-medium whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
              {infoModal.content}
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-2.5 px-5 sm:px-6 rounded-xl transition-colors shadow-md text-sm sm:text-base"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌊 FOOTER (PREMIUM) */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-10 sm:mt-16 rounded-t-[3rem] shadow-sm w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              Kampüs içindeki güvenli 2. el pazar yerin. Sadece üniversite
              öğrencilerine özel, doğrulanmış ve güvenilir alışveriş deneyimi.
            </p>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-500">
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Nasıl Çalışır?",
                      "UniCycle'da alışveriş yapmak çok kolay!\n\n1. Kendi üniversitenin e-postasıyla kayıt ol.\n2. İhtiyacın olmayan eşyalarını ilan olarak ekle.\n3. Kampüsündeki diğer öğrencilerle mesajlaşarak güvenle alışveriş yap!",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Nasıl Çalışır?
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Güvenlik İpuçları",
                      "Alışverişlerinde güvenliğin için şu kurallara dikkat et:\n\n• Sadece kampüs içindeki güvenli ve kalabalık alanlarda (kütüphane, kafeterya vb.) buluşun.\n• Kimseye önceden para veya kapora göndermeyin.\n• Şüpheli durumlarda ilanları bize şikayet edin.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Güvenlik İpuçları
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Kampüs Kuralları",
                      "Bu platform tamamen öğrencilere aittir.\n\n• Saygılı bir iletişim dili kullanmak zorunludur.\n• Sadece yasal ve kampüs kurallarına uygun ürünler satılabilir.\n• Kopya veya telif hakkı ihlali içeren materyallerin satışı yasaktır.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Kampüs Kuralları
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold mb-4">İletişim</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-500">
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Destek Merkezi",
                      "Yaşadığın bir sorun mu var?\n\nEkibimize destek@unicycle.com adresinden ulaşabilirsin.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Destek Merkezi
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Bize Ulaşın",
                      "Adres: UniCycle Öğrenci İnovasyon Merkezi, Teknopark Binası, 3. Kat\n\nE-posta: iletisim@unicycle.com\nTelefon: +90 (850) 123 45 67",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Bize Ulaşın
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Sıkça Sorulan Sorular",
                      "S: Üye olmak ücretli mi?\nC: Hayır, UniCycle üniversite öğrencileri için tamamen ücretsizdir.\n\nS: Kargo ile ürün gönderebilir miyim?\nC: Platformumuz kampüs içi elden teslim odaklıdır ancak satıcı ile anlaşırsanız kargo da yapabilirsiniz.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  S.S.S.
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
          © 2026 UniCycle. Tüm hakları saklıdır.
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; } @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; } } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; } .desktop-search { display: none; } .mobile-search { display: block; } @media (min-width: 768px) { .desktop-search { display: flex; } .mobile-search { display: none; } }`,
        }}
      />
    </div>
  );
}
