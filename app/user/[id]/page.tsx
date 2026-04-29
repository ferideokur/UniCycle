"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Heart,
  Share2,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Send,
  Bell,
  MessageCircle,
  Package,
  UserPlus,
  UserCheck,
} from "lucide-react";

// 🇹🇷 Türkçe İyelik Eki Bulucu
const getTurkishSuffix = (name: string) => {
  if (!name) return "'in";
  const vowels = "aıeiouöüAIIEİOUÖÜ";
  const chars = name.toLowerCase().split("");
  let lastVowel = "i";
  for (let i = chars.length - 1; i >= 0; i--) {
    if (vowels.includes(chars[i])) {
      lastVowel = chars[i];
      break;
    }
  }
  const endsWithVowel = vowels.includes(chars[chars.length - 1]);
  if (["a", "ı"].includes(lastVowel)) return endsWithVowel ? "'nın" : "'ın";
  if (["e", "i"].includes(lastVowel)) return endsWithVowel ? "'nin" : "'in";
  if (["o", "u"].includes(lastVowel)) return endsWithVowel ? "'nun" : "'un";
  if (["ö", "ü"].includes(lastVowel)) return endsWithVowel ? "'nün" : "'ün";
  return "'in";
};

// 🚀 İsimleri Javascript içinde her yerde büyük harfle başlatan formül
const formatName = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        const followMemory = localStorage.getItem(
          `follows_${parsedUser.id}_${id}`,
        );
        if (followMemory === "true") setIsFollowing(true);

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
              setNotificationsCount(unreadNotifs.length);
              setNotificationsList(activeNotifs);
            }
          })
          .catch((err) => console.error("Bildirimler çekilemedi:", err));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchData = async () => {
      try {
        const userRes = await fetch(
          `https://unicycle-api.onrender.com/api/users/${id}`,
          { cache: "no-store" },
        );
        if (!userRes.ok) throw new Error("Kullanıcı bulunamadı");
        const userData = await userRes.json();
        setUser(userData);

        const savedProfile = localStorage.getItem(`profile_${userData.email}`);
        if (savedProfile) setProfileData(JSON.parse(savedProfile));

        const prodRes = await fetch(
          "https://unicycle-api.onrender.com/api/products",
        );
        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          if (Array.isArray(allProducts)) {
            const userProducts = allProducts.filter(
              (p: any) => p.user && Number(p.user.id) === Number(id),
            );
            setListings(userProducts.sort((a: any, b: any) => b.id - a.id));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const clearNotifs = () => setNotificationsCount(0);
    window.addEventListener("notificationsSeen", clearNotifs);
    return () => window.removeEventListener("notificationsSeen", clearNotifs);
  }, []);

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

        let combined: any[] = [];
        if (isUserSearch) {
          const res = await fetch(
            `https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(query)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data))
              combined = data.map((u: any) => ({ type: "user", item: u }));
          }
        } else {
          const res = await fetch(
            `https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(query)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data))
              combined = data.map((p: any) => ({ type: "product", item: p }));
          }
        }
        setLiveResults(combined);
      } catch (err) {
        console.error(err);
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
    if (currentUser) {
      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/users/${currentUser.id}/logout`,
          { method: "POST" },
        );
      } catch (e) {
        console.error("Çıkış yapılırken sunucuya ulaşılamadı.");
      }
    }
    localStorage.removeItem("user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return showToast("🔒 Takip etmek için giriş yapmalısın!");
    if (Number(currentUser.id) === Number(id))
      return showToast("Kendini takip edemezsin! 😅");

    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);

    const formattedUserName = formatName(user?.fullName || "Kullanıcı");
    const formattedCurrentUserName = formatName(currentUser.fullName);

    try {
      await fetch("https://unicycle-api.onrender.com/api/interaction/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUser.id,
          followingId: Number(id),
        }),
      });

      localStorage.setItem(
        `follows_${currentUser.id}_${id}`,
        newFollowState ? "true" : "false",
      );
      showToast(
        newFollowState
          ? `${formattedUserName} takip edildi!`
          : `${formattedUserName} takipten çıkıldı.`,
      );

      if (newFollowState) {
        await fetch(
          "https://unicycle-api.onrender.com/api/interaction/notifications",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: Number(id),
              message: `${formattedCurrentUserName} seni takip etmeye başladı.`,
            }),
          },
        );
      }
    } catch (err) {
      console.error("Takip işlemi başarısız:", err);
      setIsFollowing(!newFollowState);
      showToast("❌ İşlem başarısız, tekrar dene.");
    }
  };

  const handleMessageClick = () => {
    if (!currentUser) return showToast("🔒 Mesaj atmak için giriş yapmalısın!");
    if (user) {
      window.dispatchEvent(
        new CustomEvent("openChatWithContext", {
          detail: {
            sellerId: user.id,
            sellerName: user.fullName,
            productTitle: "",
          },
        }),
      );
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-slate-500">
        <div className="animate-spin text-4xl sm:text-5xl">⏳</div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-2xl font-bold text-slate-800">
          Kullanıcı bulunamadı!
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 font-bold hover:underline"
        >
          Geri Dön
        </button>
      </div>
    );

  const safeLiveResults = Array.isArray(liveResults) ? liveResults : [];

  // 🚀 TİP HATASINI ÇÖZEN KISIM (safeFullName geri geldi, formatted ile güçlendi)
  const safeFullName = user?.fullName || "Kullanıcı";
  const formattedSafeFullName = formatName(safeFullName);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedSafeFullName)}&background=0D8ABC&color=fff&size=256`;

  const displayUniversity = user?.university || "Üniversite Belirtilmemiş";
  const displayBio = profileData?.bio || "Merhaba! UniCycle'da yeniyim.";
  const isOwner = currentUser && Number(currentUser.id) === Number(id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative w-full overflow-x-hidden flex flex-col">
      {/* 🌟 BİLDİRİM (TOAST) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 ÜST MENÜ NAVBAR */}
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
                <svg
                  className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#20B2AA] transition-colors pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <button type="submit" className="hidden">
                  Ara
                </button>
              </form>

              {isDropdownOpen && safeLiveResults.length > 0 && (
                <div className="absolute top-full left-6 right-10 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                  {safeLiveResults.slice(0, 5).map((result, idx) => (
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
                          ? (result.item.fullName || "U")
                              .charAt(0)
                              .toUpperCase()
                          : "📦"}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        {result.item.fullName || result.item.title}
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

              {currentUser ? (
                <div className="flex items-center gap-2 sm:gap-4 relative">
                  <Link
                    href="/favorites"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 transition-all rounded-full flex items-center justify-center border border-slate-200 shadow-sm group shrink-0"
                    title="Favorilerim"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300" />
                  </Link>

                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 transition-all rounded-full flex items-center justify-center border border-slate-200 shadow-sm group shrink-0"
                      title="Bildirimler"
                    >
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300" />
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
                                      {notif.message}
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
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <button type="submit" className="hidden">
              Ara
            </button>
          </form>
          {isDropdownOpen && safeLiveResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
              {safeLiveResults.slice(0, 4).map((result, idx) => (
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
                        {(result.item.fullName || "U").charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs">📦</span>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-bold text-slate-800 truncate text-xs">
                      {result.item.fullName || result.item.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 🔙 GERİ DÖN */}
      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-0 mt-4 sm:mt-6 mb-6">
        <button
          onClick={() => router.back()}
          className="font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 text-xs sm:text-sm"
        >
          &larr; Geri Dön
        </button>
      </div>

      {/* 👤 PROFİL KARTI */}
      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-0 relative">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 sm:h-48 w-full relative bg-gradient-to-r from-blue-500 to-indigo-600">
            {profileData?.coverImage && (
              <img
                src={profileData.coverImage}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `center ${profileData.coverY || 50}%`,
                }}
              />
            )}
          </div>

          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                <img
                  src={profileData?.profileImage || defaultAvatar}
                  className="w-full h-full object-cover origin-center"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-4">
                {isOwner ? (
                  <div className="bg-green-50 text-green-700 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm border border-green-200">
                    ✨ Senin Profilin
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleMessageClick}
                      className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />{" "}
                      <span className="hidden sm:inline">Mesaj At</span>
                    </button>
                    <button
                      onClick={handleFollowToggle}
                      className={`font-bold py-1.5 px-4 sm:py-2 sm:px-6 rounded-full text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 ${
                        isFollowing
                          ? "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          : "bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                          <span>Takip Ediliyor</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Takip Et</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                {formattedSafeFullName}{" "}
                <ShieldCheck className="text-blue-500 w-5 h-5 sm:w-7 sm:h-7" />
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-0.5">
                @{safeFullName.split(" ")[0].toLowerCase()}
              </p>

              <p className="text-xs sm:text-lg font-bold text-gray-600 mt-2">
                👩‍🎓 {displayUniversity}
              </p>

              <p className="text-slate-700 mt-3 text-sm font-medium leading-relaxed">
                {displayBio}
              </p>
            </div>
          </div>
        </div>

        {/* 🛍️ VİTRİN */}
        <div className="mt-8 mb-8 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            🛍️ <span>{formattedSafeFullName.split(" ")[0]}</span>
            {getTurkishSuffix(formattedSafeFullName.split(" ")[0])} Vitrini{" "}
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-sm">
              {listings.length}
            </span>
          </h2>
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <span className="text-5xl block mb-4">📭</span>
              <h3 className="text-xl font-bold text-slate-600">
                Kullanıcının henüz bir ilanı yok.
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {listings.map((p) => (
                <Link
                  href={`/listing-detail/${p.id}`}
                  key={p.id}
                  className="group block relative cursor-pointer"
                >
                  <div className="aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 mb-2 relative border shadow-sm group-hover:shadow-md transition">
                    {p.photosBase64?.[0] ? (
                      <img
                        src={p.photosBase64[0]}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                    {p.priceType === "takas" && (
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">
                        Takaslık
                      </div>
                    )}
                    {p.priceType === "ucretsiz" && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">
                        Ücretsiz
                      </div>
                    )}
                  </div>
                  <div>
                    <h3
                      className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-1 mb-0.5 sm:mb-1"
                      title={p.title}
                    >
                      {p.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 line-clamp-1">
                      {p.category}
                    </p>
                    <div className="text-sm sm:text-lg font-black text-gray-900">
                      {p.priceType === "fiyat"
                        ? `₺${p.price}`
                        : p.priceType === "takas"
                          ? "Takas"
                          : "Bedava"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌊 FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-auto rounded-t-[3rem] shadow-sm w-full">
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
                <button className="hover:text-blue-600 transition-colors">
                  Nasıl Çalışır?
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Güvenlik İpuçları
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Kampüs Kuralları
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold mb-4">İletişim</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-500">
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Destek Merkezi
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Bize Ulaşın
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
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
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
        .desktop-search { display: none; }
        .mobile-search { display: block; }
        @media (min-width: 768px) { .desktop-search { display: flex; } .mobile-search { display: none; } }
      `,
        }}
      />
    </div>
  );
}
