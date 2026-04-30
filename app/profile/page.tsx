"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
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

// 🧹 BİLDİRİM TEMİZLEYİCİ
const cleanNotification = (msg: string) => {
  if (!msg) return "";
  let text = msg
    .replace(/[💭💬🗨️]/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.includes(",")) {
    const parts = text.split(",");
    return `${formatName(parts[0].trim())}, ${parts.slice(1).join(",").trim()}`;
  }

  if (text.toLowerCase().includes("sana bir mesaj gönderdi")) {
    const namePart = text.replace(/sana bir mesaj gönderdi\.?/i, "").trim();
    return `${formatName(namePart)} sana bir mesaj gönderdi.`;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function UserProfilePage() {
  const [user, setUser] = useState<{
    id: number;
    fullName: string;
    email: string;
    university?: string;
  } | null>(null);

  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Profil Güncelleme State'leri
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverY, setCoverY] = useState(50); // Kapak fotoğrafı dikey pozisyonu
  const [isDraggingCover, setIsDraggingCover] = useState(false);

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
    if (!storedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Kayıtlı profil verilerini çek
    const savedProfile = localStorage.getItem(`profile_${parsedUser.email}`);
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setBio(parsedProfile.bio || "");
      setProfileImage(parsedProfile.profileImage || null);
      setCoverImage(parsedProfile.coverImage || null);
      setCoverY(parsedProfile.coverY || 50);
    }

    // Bildirimleri Çek
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

    // Kullanıcının ilanlarını çek
    fetch("https://unicycle-api.onrender.com/api/products")
      .then((res) => res.json())
      .then((allProducts) => {
        if (Array.isArray(allProducts)) {
          const userProducts = allProducts.filter(
            (p: any) => p.user && p.user.id === parsedUser.id,
          );
          setListings(userProducts.sort((a: any, b: any) => b.id - a.id));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
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

  const handleSaveProfile = () => {
    if (!user) return;
    const profileData = { bio, profileImage, coverImage, coverY };
    localStorage.setItem(`profile_${user.email}`, JSON.stringify(profileData));
    setIsEditing(false);
    alert("Profil başarıyla güncellendi!");
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "profile") setProfileImage(reader.result as string);
        else setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteListing = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/products/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setListings((prev) => prev.filter((listing) => listing.id !== id));
        alert("İlan başarıyla silindi!");
      }
    } catch (error) {
      console.error("Silme işlemi başarısız:", error);
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-slate-500">
        <div className="animate-spin text-4xl sm:text-5xl">⏳</div>
      </div>
    );
  }

  const safeFullName = user?.fullName || "Kullanıcı";
  const formattedSafeFullName = formatName(safeFullName);
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedSafeFullName)}&background=20B2AA&color=fff&size=256`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative w-full overflow-x-hidden flex flex-col">
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

            {/* ✨ PREMIUM ARAMA ÇUBUĞU */}
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
                          ? formatName(result.item.fullName || "U").charAt(0)
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

              <div className="flex items-center gap-2 sm:gap-4 relative">
                {/* 🚀 ORİJİNAL İNCE KALP İKONU */}
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
                  {/* 🚀 ORİJİNAL İNCE ZİL İKONU */}
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
                          notificationsList.map((notif: any) => {
                            let icon = <MessageCircle className="w-5 h-5" />;
                            let bg = "bg-green-50";
                            let text = "text-green-500";
                            const msgLower = notif.message?.toLowerCase() || "";
                            if (
                              msgLower.includes("beğen") ||
                              msgLower.includes("favori")
                            ) {
                              icon = <Heart className="w-5 h-5 fill-current" />;
                              bg = "bg-red-50";
                              text = "text-red-500";
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

                            const formattedMessage = cleanNotification(
                              notif.message,
                            );

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
                        Tüm Bildirimleri Gör
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

      {/* 👤 PROFİL KARTI */}
      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-0 mt-6 sm:mt-10 relative">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-32 sm:h-48 w-full relative bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden group">
            {coverImage && (
              <img
                src={coverImage}
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ objectPosition: `center ${coverY}%` }}
              />
            )}

            {isEditing && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <label className="bg-white/90 text-slate-800 px-4 py-2 rounded-full font-bold text-sm cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
                  📷 Kapak Yükle
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "cover")}
                  />
                </label>
                {coverImage && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={coverY}
                    onChange={(e) => setCoverY(Number(e.target.value))}
                    className="w-1/2 cursor-pointer accent-blue-500"
                    title="Kapağı Yukarı/Aşağı Kaydır"
                  />
                )}
              </div>
            )}
          </div>

          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 relative group shrink-0">
                <img
                  src={profileImage || defaultAvatar}
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    Değiştir
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "profile")}
                    />
                  </label>
                )}
              </div>

              {isEditing ? (
                <button
                  onClick={handleSaveProfile}
                  className="bg-green-600 hover:bg-green-700 text-white font-black py-2 px-6 rounded-full text-sm transition-all shadow-md hover:scale-105 active:scale-95"
                >
                  Kaydet
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-sm"
                >
                  Düzenle
                </button>
              )}
            </div>

            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {formattedSafeFullName}
              </h1>
              <p className="text-sm font-bold text-slate-400 mt-0.5">
                @{user?.fullName.split(" ")[0].toLowerCase()}
              </p>

              <p className="text-xs sm:text-lg font-bold text-gray-600 mt-2">
                👩‍🎓 {user?.university || "Üniversite Belirtilmemiş"}
              </p>

              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendinden bahset..."
                  className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  maxLength={150}
                />
              ) : (
                <p className="text-slate-600 mt-3 text-sm font-medium leading-relaxed max-w-lg">
                  {bio || "Hoş geldin! Burası senin kişisel vitrinin."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 🛍️ VİTRİNİM */}
        <div className="mt-8 mb-8 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            🛍️ Senin Vitrinin
            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold">
              {listings.length} Ürün
            </span>
          </h2>

          {listings.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
              <span className="text-5xl block mb-4">📭</span>
              <h3 className="text-xl font-bold text-slate-600 mb-2">
                Henüz ilan vermedin
              </h3>
              <p className="text-slate-500 font-medium mb-6">
                Artık kullanmadığın eşyaları satarak değerlendirmeye ne dersin?
              </p>
              <Link
                href="/create-listing"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-1 inline-block"
              >
                Hemen İlan Ver
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {listings.map((p) => (
                <Link
                  href={`/listing-detail/${p.id}`}
                  key={p.id}
                  className="group block relative cursor-pointer"
                >
                  <div className="aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-3 relative border shadow-sm group-hover:shadow-md transition">
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
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
                        Takas
                      </div>
                    )}
                    {p.priceType === "ucretsiz" && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
                        Ücretsiz
                      </div>
                    )}

                    <button
                      onClick={(e) => handleDeleteListing(e, p.id)}
                      className="absolute top-2 right-2 bg-red-500/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md active:scale-95 z-20"
                      title="İlanı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 mb-0.5">
                      {p.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1 line-clamp-1">
                      {p.category}
                    </p>
                    <div className="text-sm sm:text-lg font-black text-slate-900">
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
