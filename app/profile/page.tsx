"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Heart,
  Share2,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Send,
} from "lucide-react";

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
  } | null>(null);

  const [newName, setNewName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [bio, setBio] = useState("Hoş geldin! Burası senin kişisel vitrinin.");
  const [university, setUniversity] = useState("Piri Reis Üniversitesi");
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

  // 💬 CHAT (MESAJLAŞMA) SİSTEMİ
  const [isMessagesListOpen, setIsMessagesListOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [inboxChats, setInboxChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<
    { id: number; text: string; isMine: boolean }[]
  >([]);

  const router = useRouter();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const totalUnreadMessages = inboxChats.reduce(
    (total, chat) => total + chat.unread,
    0,
  );

  const fetchInbox = async (userId: number) => {
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/messages/inbox/${userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setInboxChats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatHistory = async (otherUserId: number) => {
    if (!user) return;
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/messages/history?user1Id=${user.id}&user2Id=${otherUserId}`,
      );
      if (res.ok) {
        const data = await res.json();
        const formattedMsgs = data.map((m: any) => ({
          id: m.id,
          text: m.content,
          isMine: m.sender.id === user.id,
        }));
        setMessages(formattedMsgs);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
      }

      fetchMyRealListings(parsedUser.id);
      fetchInbox(parsedUser.id);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      interval = setInterval(() => {
        fetchInbox(user.id);
        if (activeChatUser) fetchChatHistory(activeChatUser.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [user, activeChatUser]);

  const handleCancel = () => {
    loadProfileData();
    setActiveModal("none");
    setPasswordConfirm("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
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

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeChatUser]);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width,
          height = img.height;
        const MAX_SIZE = 1200;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        if (type === "profile") {
          setProfileImage(dataUrl);
          setProfileZoom(1);
          setProfileRotate(0);
        }
        if (type === "cover") {
          setCoverImage(dataUrl);
          setCoverY(50);
        }
      };
    };
    reader.readAsDataURL(file);
  };

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

      if (isInfoUpdate && newName.trim() !== user?.fullName) {
        const updatedUser = { ...user, fullName: newName.trim() };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser as any);
      }

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
      setIsSaving(false);
    }
  };

  const openChatWith = (chatUser: { id: number; name: string }) => {
    setActiveChatUser(chatUser);
    setIsMessagesListOpen(false);
    fetchChatHistory(chatUser.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !activeChatUser) return;
    const content = chatInput;
    setChatInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: content, isMine: true },
    ]);

    try {
      const res = await fetch(
        "https://unicycle-api.onrender.com/api/messages/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: activeChatUser.id,
            content: content,
          }),
        },
      );
      if (res.ok) {
        fetchChatHistory(activeChatUser.id);
        fetchInbox(user.id);
      }
    } catch (e) {
      console.error(e);
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

      {/* 🚀 NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform shrink-0"
          >
            <Image
              src="/logo.jpeg"
              alt="UniCycle"
              width={36}
              height={36}
              className="rounded-md sm:w-[52px] sm:h-[52px]"
              priority
            />
            <span className="text-xl sm:text-[32px] font-extrabold text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-3xl relative group">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Ürün, @üye veya ders notu ara..."
                className="w-full bg-slate-100 rounded-full py-3 px-6 pl-14 focus:ring-2 focus:ring-blue-500 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
              <span className="absolute left-5 top-3.5 text-slate-400">🔍</span>
            </form>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
            <Link
              href="/create-listing"
              className="hidden md:flex font-black text-blue-600 items-center gap-1"
            >
              + İlan Ver
            </Link>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  {notificationsCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse">
                      {notificationsCount}
                    </span>
                  )}
                </button>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold"
                >
                  <span className="hidden sm:block text-sm">Hesabım</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-slate-400 hover:text-red-500 font-bold text-sm"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold text-sm"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

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
              className="absolute top-4 right-4 bg-white/90 text-gray-800 font-bold py-2 px-5 rounded-full text-xs sm:text-base shadow-lg"
            >
              📷 Kapağı Düzenle
            </button>
          )}
        </div>
        <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div
              onClick={() => isEditMode && setActiveModal("profile")}
              className={`w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-md bg-gray-100 relative overflow-hidden flex items-center justify-center ${isEditMode ? "cursor-pointer" : ""}`}
            >
              <img
                src={profileImage || defaultAvatar}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${profileZoom}) rotate(${profileRotate}deg)`,
                }}
              />
              {isEditMode && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-3xl">📷</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3">
              {isEditMode && (
                <button
                  onClick={() => setActiveModal("info")}
                  className="bg-blue-50 text-blue-600 font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full text-xs sm:text-base"
                >
                  📝 Bilgiler
                </button>
              )}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full text-xs sm:text-base border transition ${isEditMode ? "bg-green-500 text-white" : "bg-white text-gray-700"}`}
              >
                {isEditMode ? "✅ Bitti" : "✏️ Düzenle"}
              </button>
            </div>
          </div>
          <div className="mt-2">
            <h1 className="text-xl sm:text-3xl font-black flex items-center gap-2">
              {user ? user.fullName : "Yükleniyor..."}{" "}
              <span className="text-blue-500">✓</span>
            </h1>
            <p className="text-xs sm:text-lg font-bold text-gray-600 mt-1">
              👩‍🎓 {displayUniversity}
            </p>
            <p className="text-xs sm:text-[15px] text-gray-700 mt-2 font-medium whitespace-pre-wrap">
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
      <div className="max-w-5xl mx-auto mt-6 px-4 sm:px-0 w-full">
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
                className="bg-blue-600 text-white font-black py-3 px-8 rounded-full mt-4 inline-block"
              >
                İlk İlanını Ver
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {myListings.map((listing) => (
                <Link
                  href={`/listing-detail/${listing.id}`}
                  key={listing.id}
                  className="group block relative"
                >
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 mb-2 relative border">
                    {listing.photosBase64?.[0] ? (
                      <img
                        src={listing.photosBase64[0]}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDeleteListing(listing.id, e)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-100 lg:opacity-0 group-hover:opacity-100 transition z-10"
                    >
                      🗑️
                    </button>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold truncate">
                    {listing.title}
                  </h3>
                  <div className="text-sm sm:text-lg font-black">
                    {listing.priceType === "fiyat"
                      ? `₺${listing.price}`
                      : listing.priceType === "takas"
                        ? "Takas"
                        : "Bedava"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 💬 CHAT WIDGET */}
      {!isMessagesListOpen && !activeChatUser && (
        <button
          onClick={() => setIsMessagesListOpen(true)}
          className="fixed bottom-6 right-6 z-[9990] bg-[#20B2AA] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all"
        >
          <MessageSquare className="w-7 h-7" />
          {totalUnreadMessages > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 w-5 h-5 text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {totalUnreadMessages}
            </span>
          )}
        </button>
      )}

      {isMessagesListOpen && (
        <div className="fixed bottom-0 right-0 sm:right-8 w-full sm:w-[350px] h-[55vh] sm:h-[500px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-[9999] flex flex-col border overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex justify-between">
            <h3 className="font-bold">💬 Mesajlar</h3>
            <button onClick={() => setIsMessagesListOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y bg-white">
            {inboxChats.length === 0 ? (
              <div className="text-center text-gray-500 mt-16 text-sm">
                Mesaj yok.
              </div>
            ) : (
              inboxChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => openChatWith(chat)}
                  className="p-4 flex gap-3 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{chat.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMsg}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeChatUser && (
        <div className="fixed bottom-0 right-0 sm:right-8 w-full sm:w-[350px] h-[55vh] sm:h-[500px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-[9999] flex flex-col border overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveChatUser(null);
                  setIsMessagesListOpen(true);
                }}
              >
                &larr;
              </button>
              <h3 className="font-bold text-sm">{activeChatUser.name}</h3>
            </div>
            <button onClick={() => setActiveChatUser(null)}>✕</button>
          </div>
          <div
            ref={chatScrollRef}
            className="flex-1 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-xs shadow-sm ${msg.isMine ? "bg-blue-600 text-white self-end rounded-br-sm" : "bg-white border self-start rounded-bl-sm"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t flex gap-2"
          >
            <input
              type="text"
              placeholder="Mesaj..."
              className="flex-1 bg-slate-100 text-sm px-4 py-2 rounded-full outline-none"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* 📸 MODALLAR */}
      {activeModal === "cover" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Kapak Düzenle</h2>
              <button onClick={handleCancel}>✕</button>
            </div>
            <div className="p-6 bg-gray-50">
              <div
                onClick={() => coverInputRef.current?.click()}
                className="h-40 w-full rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer relative bg-gray-200"
              >
                {coverImage && (
                  <img
                    src={coverImage}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: `center ${coverY}%` }}
                  />
                )}
                <div className="absolute bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  📷 Seç
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={coverInputRef}
                onChange={(e) => handleImageUpload(e, "cover")}
              />
              {coverImage && (
                <div className="mt-4 flex items-center gap-3 bg-white p-3 rounded-lg border">
                  <span className="text-xs font-bold whitespace-nowrap">
                    Yukarı/Aşağı:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={coverY}
                    onChange={(e) => setCoverY(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <button
                    onClick={() => setCoverImage(null)}
                    className="text-red-500 text-xs font-bold whitespace-nowrap"
                  >
                    🗑️ Kaldır
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-500 font-bold"
              >
                İptal
              </button>
              <button
                onClick={() => saveAllData(false)}
                disabled={isSaving}
                className="px-6 py-2 bg-[#20B2AA] text-white font-bold rounded-lg"
              >
                {isSaving ? "⏳" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "profile" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Profil Fotoğrafı</h2>
              <button onClick={handleCancel}>✕</button>
            </div>
            <div className="p-6 flex flex-col sm:flex-row gap-6 items-center bg-gray-50">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center shrink-0">
                <img
                  src={profileImage || defaultAvatar}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${profileZoom}) rotate(${profileRotate}deg)`,
                  }}
                />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="text-xs font-bold">
                    Yakınlaştır ({profileZoom}x)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={profileZoom}
                    onChange={(e) => setProfileZoom(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold">
                    Döndür ({profileRotate}°)
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={profileRotate}
                    onChange={(e) =>
                      setProfileRotate(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => profileInputRef.current?.click()}
                    className="flex-1 bg-teal-50 text-teal-700 py-2 rounded-lg font-bold text-sm"
                  >
                    📷 Yeni
                  </button>
                  {profileImage && (
                    <button
                      onClick={() => {
                        setProfileImage(null);
                        setProfileZoom(1);
                        setProfileRotate(0);
                      }}
                      className="bg-red-50 text-red-500 py-2 px-4 rounded-lg font-bold text-sm"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={profileInputRef}
                  onChange={(e) => handleImageUpload(e, "profile")}
                />
              </div>
            </div>
            <div className="p-4 bg-white border-t flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-500 font-bold"
              >
                İptal
              </button>
              <button
                onClick={() => saveAllData(false)}
                disabled={isSaving}
                className="px-6 py-2 bg-[#20B2AA] text-white font-bold rounded-lg"
              >
                {isSaving ? "⏳" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "info" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Bilgiler</h2>
              <button onClick={handleCancel}>✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="text-sm font-bold block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border rounded-lg p-2.5 outline-none focus:border-[#20B2AA]"
                />
              </div>
              {newName.trim() !== user?.fullName && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <label className="text-xs font-bold text-red-600 block mb-1">
                    Şifre Onayı (İsim Değişikliği İçin)
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full border rounded-lg p-2 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-bold block mb-1">
                  Üniversite
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full border rounded-lg p-2.5 outline-none focus:border-[#20B2AA]"
                >
                  {UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              {university === "Diğer..." && (
                <div>
                  <label className="text-sm font-bold text-red-600 block mb-1">
                    Okul Adı
                  </label>
                  <input
                    type="text"
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    className="w-full border border-red-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-bold block mb-1">Hakkımda</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border rounded-lg p-2.5 outline-none resize-none focus:border-[#20B2AA]"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-500 font-bold"
              >
                İptal
              </button>
              <button
                onClick={() => saveAllData(true)}
                disabled={isSaving}
                className="px-6 py-2 bg-[#20B2AA] text-white font-bold rounded-lg"
              >
                {isSaving ? "⏳" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
