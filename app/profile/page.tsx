"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function ProfilePage() {
  const [user, setUser] = useState<{
    id: number;
    fullName: string;
    email: string;
    university?: string;
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [bio, setBio] = useState("Hoş geldin! Burası senin kişisel vitrinin.");
  const [university, setUniversity] = useState("Üniversite Belirtilmemiş");
  const [customUniversity, setCustomUniversity] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileRotate, setProfileRotate] = useState(0);
  const [coverY, setCoverY] = useState(50);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "none" | "cover" | "profile" | "info"
  >("none");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const router = useRouter();

  const loadProfileData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setNewName(parsedUser.fullName);

      const userProfileKey = `profile_${parsedUser.email}`;
      const savedProfile = localStorage.getItem(userProfileKey);

      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        if (data.bio) setBio(data.bio);
        if (data.university) {
          if (UNIVERSITIES.includes(data.university)) {
            setUniversity(data.university);
            setCustomUniversity("");
          } else {
            setUniversity("Diğer...");
            setCustomUniversity(data.university);
          }
        }
        if (data.profileImage) setProfileImage(data.profileImage);
        if (data.coverImage) setCoverImage(data.coverImage);
        if (data.profileZoom) setProfileZoom(data.profileZoom);
        if (data.profileRotate) setProfileRotate(data.profileRotate);
        if (data.coverY) setCoverY(data.coverY);
      } else if (parsedUser.university) {
        setUniversity(parsedUser.university);
      }

      fetchMyRealListings(parsedUser.id);

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
        .catch((err) => console.error(err));
    }
  };

  const fetchMyRealListings = async (userId: number) => {
    setIsLoadingListings(true);
    try {
      const response = await fetch(
        "https://unicycle-api.onrender.com/api/products",
      );
      if (response.ok) {
        const allProducts = await response.json();
        const myOwnProducts = allProducts.filter(
          (product: any) => product.user && product.user.id === userId,
        );
        setMyListings(myOwnProducts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingListings(false);
    }
  };

  const handleDeleteListing = async (
    productId: number,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("İlanı tamamen silmek istediğine emin misin?")) return;
    try {
      const response = await fetch(
        `https://unicycle-api.onrender.com/api/products/${productId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setMyListings((prev) => prev.filter((l) => l.id !== productId));
        alert("İlan başarıyla silindi! 🗑️");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProfileData();
    const clearNotifs = () => setNotificationsCount(0);
    window.addEventListener("notificationsSeen", clearNotifs);
    return () => window.removeEventListener("notificationsSeen", clearNotifs);
  }, []);

  const handleCancel = () => {
    loadProfileData();
    setActiveModal("none");
    setPasswordConfirm("");
  };
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmFirst = window.confirm(
      "⚠️ DİKKAT: Hesabını ve tüm ilanlarını kalıcı olarak silmek istediğine emin misin?",
    );
    if (!confirmFirst) return;
    try {
      setIsSaving(true);
      const response = await fetch(
        `https://unicycle-api.onrender.com/api/users/${user.id}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        alert(
          "Hesabın ve tüm verilerin başarıyla silindi. Seni özleyeceğiz! 👋",
        );
        localStorage.removeItem("user");
        window.location.href = "/";
      } else {
        alert("Hesap silinirken bir hata oluştu.");
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "")
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

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
        setLiveResults(combined);
      } catch (error) {
        console.error(error);
      }
    };
    const timer = setTimeout(() => fetchLive(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const saveAllData = async (isInfoUpdate = false) => {
    if (isInfoUpdate) {
      if (university === "Diğer..." && customUniversity.trim() === "") {
        alert("Okul adını girin!");
        return;
      }
      if (newName.trim() !== user?.fullName && passwordConfirm.trim() === "") {
        alert("İsim değişikliği için mevcut şifreni girmelisin!");
        return;
      }
    }
    try {
      setIsSaving(true);
      const finalUniversity =
        university === "Diğer..." ? customUniversity.trim() : university;
      if (isInfoUpdate && user?.id) {
        const response = await fetch(
          `https://unicycle-api.onrender.com/api/users/${user.id}/update-university`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ university: finalUniversity }),
          },
        );
        if (!response.ok) throw new Error("Veritabanı güncellenemedi!");
      }
      const updatedUser = {
        ...user,
        fullName: newName.trim(),
        university: finalUniversity,
      } as any;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      localStorage.setItem(
        `profile_${user?.email}`,
        JSON.stringify({
          bio,
          university: finalUniversity,
          profileImage,
          coverImage,
          profileZoom,
          profileRotate,
          coverY,
        }),
      );
      setIsSaving(false);
      setActiveModal("none");
      setPasswordConfirm("");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      alert("Hata oluştu! Sunucunun çalıştığından emin olun.");
      setIsSaving(false);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user ? user.fullName : "Kullanıcı"}&background=20B2AA&color=fff&size=256`;
  const displayUniversity =
    university === "Diğer..." ? customUniversity : university;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans w-full overflow-x-hidden flex flex-col">
      {showToast && (
        <div className="fixed top-28 right-8 z-[200] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold animate-in fade-in slide-in-from-top-5">
          ✅ Değişiklikler Kaydedildi!
        </div>
      )}

      {/* 🚀 NAVBAR (Premium Tasarım) */}
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
                          ? result.item.fullName.charAt(0).toUpperCase()
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
              {/* 🚀 DÜZELTİLEN İLAN VER BUTONU RENGİ */}
              <Link
                href="/create-listing"
                className="hidden md:flex font-black text-[#20B2AA] hover:text-teal-700 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>
              <Link
                href="/create-listing"
                className="flex md:hidden font-black text-[#20B2AA] hover:text-teal-700 items-center gap-1 transition-colors text-[11px] sm:text-base border border-[#20B2AA] px-2 py-1.5 rounded-lg"
              >
                <span className="text-sm">+</span> İlan
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
                      <div className="absolute top-full right-[-20px] sm:right-0 mt-3 w-[300px] sm:w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
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
                              let icon = "✨";
                              let bg = "bg-blue-100";
                              let text = "text-blue-600";
                              const msgLower = notif.message.toLowerCase();
                              if (msgLower.includes("takip")) {
                                icon = "🌸";
                                bg = "bg-pink-100";
                                text = "text-pink-600";
                              } else if (msgLower.includes("ilan")) {
                                icon = "📦";
                                bg = "bg-orange-100";
                                text = "text-orange-600";
                              } else if (
                                msgLower.includes("beğen") ||
                                msgLower.includes("favori")
                              ) {
                                icon = "❤️";
                                bg = "bg-red-100";
                                text = "text-red-600";
                              }
                              return (
                                <div
                                  key={notif.id}
                                  className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex gap-3 items-center"
                                >
                                  <div
                                    className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${text} text-lg shrink-0`}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700">
                                      {notif.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
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
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
                      👤
                    </div>
                    <span className="hidden sm:block text-sm">Hesabım</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:block text-slate-400 hover:text-red-500 font-bold transition-colors text-sm ml-2"
                  >
                    Çıkış
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-slate-800 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm hover:bg-black transition-colors"
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
                        {result.item.fullName.charAt(0).toUpperCase()}
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

      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-0 mt-4 sm:mt-6 mb-6">
        <button
          onClick={() => router.back()}
          className="font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 text-xs sm:text-sm"
        >
          &larr; Geri Dön
        </button>
      </div>

      {/* 👤 PROFİL BİLGİ ALANI */}
      <div className="max-w-5xl mx-auto mt-0 sm:mt-6 bg-white sm:rounded-t-[2.5rem] sm:rounded-b-2xl shadow-sm sm:border border-gray-200 overflow-hidden w-full relative">
        <div className="h-32 sm:h-64 w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
          {coverImage && (
            <img
              src={coverImage}
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${coverY}%` }}
            />
          )}
          {isEditMode && (
            <button
              onClick={() => setActiveModal("cover")}
              className="absolute top-4 right-4 bg-white/90 text-gray-800 font-bold py-2 px-5 rounded-full text-xs sm:text-base shadow-lg hover:bg-white transition-colors"
            >
              📷 Kapağı Düzenle
            </button>
          )}
        </div>
        <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div
              onClick={() => isEditMode && setActiveModal("profile")}
              className={`w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-md bg-gray-100 relative overflow-hidden flex items-center justify-center shrink-0 ${isEditMode ? "cursor-pointer group" : ""}`}
            >
              <img
                src={profileImage || defaultAvatar}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${profileZoom}) rotate(${profileRotate}deg)`,
                }}
              />
              {isEditMode && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
                  <span className="text-white text-3xl">📷</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 shrink-0">
              {isEditMode && (
                <button
                  onClick={() => setActiveModal("info")}
                  className="bg-blue-50 text-blue-600 font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full text-xs sm:text-base hover:bg-blue-100 transition-colors shadow-sm"
                >
                  📝 Bilgiler
                </button>
              )}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full text-xs sm:text-base border transition shadow-sm ${isEditMode ? "bg-green-500 text-white border-green-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {isEditMode ? "✅ Bitti" : "✏️ Düzenle"}
              </button>
            </div>
          </div>
          <div className="mt-2">
            <h1 className="text-xl sm:text-3xl font-black flex items-center gap-2 capitalize">
              {user ? user.fullName : "Yükleniyor..."}{" "}
              <span className="text-blue-500">✓</span>
            </h1>
            {user && (
              <p className="text-sm font-bold text-slate-400 mt-0.5">
                @{user.fullName.split(" ")[0].toLowerCase()}
              </p>
            )}
            <p className="text-xs sm:text-lg font-bold text-gray-600 mt-2">
              👩‍🎓 {displayUniversity}
            </p>
            <p className="text-xs sm:text-[15px] text-gray-700 mt-2 font-medium whitespace-pre-wrap max-w-2xl leading-relaxed">
              {bio}
            </p>
          </div>
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-100">
            <div className="cursor-pointer hover:underline">
              <span className="font-black text-gray-900 mr-1 text-base">
                {myListings.length}
              </span>
              <span className="text-gray-500">Ürün</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🛍️ VİTRİNİM */}
      <div className="max-w-5xl mx-auto mt-4 sm:mt-6 px-4 sm:px-0 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg sm:text-2xl font-black text-gray-800">
              Vitrinim
            </h2>
            {myListings.length > 0 && (
              <Link
                href="/create-listing"
                className="text-blue-600 font-bold hover:underline text-sm"
              >
                + Yeni İlan
              </Link>
            )}
          </div>
          {isLoadingListings ? (
            <div className="text-center py-10 text-xl font-bold text-gray-500">
              ⏳ Veritabanına bağlanılıyor...
            </div>
          ) : myListings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <span className="text-5xl block mb-4">🛍️</span>
              <h3 className="text-xl font-bold">Vitrinin henüz boş!</h3>
              <Link
                href="/create-listing"
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-black py-3 px-8 rounded-full mt-4 inline-block shadow-md"
              >
                İlk İlanını Ver
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {myListings.map((listing) => (
                <div
                  key={listing.id}
                  className="group block relative cursor-pointer"
                >
                  <Link
                    href={`/listing-detail/${listing.id}`}
                    className="block"
                  >
                    <div className="aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 mb-2 relative border shadow-sm group-hover:shadow-md transition">
                      {listing.photosBase64?.[0] ? (
                        <img
                          src={listing.photosBase64[0]}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          📦
                        </div>
                      )}
                      {listing.priceType === "takas" && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">
                          Takaslık
                        </div>
                      )}
                      {listing.priceType === "ucretsiz" && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">
                          Ücretsiz
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteListing(listing.id, e)}
                    className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg z-20 hover:scale-110"
                  >
                    🗑️
                  </button>
                  <Link
                    href={`/listing-detail/${listing.id}`}
                    className="block"
                  >
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-1 mb-0.5 sm:mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 line-clamp-1">
                      {listing.category}
                    </p>
                    <div className="text-sm sm:text-lg font-black text-gray-900">
                      {listing.priceType === "fiyat"
                        ? `₺${listing.price}`
                        : listing.priceType === "takas"
                          ? "Takas"
                          : "Bedava"}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 📸 MODALLAR */}
      {activeModal === "info" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg sm:text-xl font-black text-gray-800">
                Bilgilerini Düzenle
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-800 text-2xl sm:text-3xl transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto bg-white custom-scrollbar">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-gray-200 font-bold text-sm sm:text-base"
                />
              </div>
              {newName.trim() !== user?.fullName && (
                <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <label className="block text-xs sm:text-sm font-bold text-red-700 mb-1">
                    🔒 Güvenlik Doğrulaması
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Şifrenizi girin..."
                    className="w-full bg-white text-gray-900 rounded-lg sm:rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 border border-red-200 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                  Üniversite
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-200 font-semibold text-xs sm:text-sm"
                >
                  {UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              {university === "Diğer..." && (
                <input
                  type="text"
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  placeholder="Örn: X Teknik Üniversitesi"
                  className="w-full bg-red-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 border border-red-200 font-semibold text-sm"
                />
              )}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                  Hakkımda
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-200 resize-none font-medium text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50/50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={handleDeleteAccount}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-sm sm:text-base order-2 sm:order-1"
              >
                🗑️ Hesabımı Kalıcı Olarak Sil
              </button>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition text-sm sm:text-base"
                >
                  İptal
                </button>
                <button
                  onClick={() => saveAllData(true)}
                  disabled={isSaving}
                  className="px-6 sm:px-10 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-white bg-[#20B2AA] hover:bg-teal-700 min-w-[100px] shadow-md transition-all text-sm sm:text-base"
                >
                  {isSaving ? "⏳..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              öğrencilerine özel alışveriş deneyimi.
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
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
          © 2026 UniCycle. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}
