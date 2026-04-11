"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  // 📦 İlan ve UI Hafızası
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  // 👤 Kullanıcı, Beğeni ve Bildirim Hafızası
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // 🔍 Arama Hafızası
  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 💬 Yorum Hafızası
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // 💬 CHAT (MESAJLAŞMA) GERÇEK SİSTEM HAFIZALARI
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
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const totalUnreadMessages = inboxChats.reduce(
    (total, chat) => total + chat.unread,
    0,
  );

  // 🔔 Navbar sayacını güncelleyen fonksiyon
  const updateNotificationCount = (userId: number) => {
    fetch(
      `https://unicycle-api.onrender.com/api/interaction/notifications/${userId}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const deletedNotifs = JSON.parse(
            localStorage.getItem(`deletedNotifs_${userId}`) || "[]",
          );
          const seenNotifs = JSON.parse(
            localStorage.getItem(`seenNotifs_${userId}`) || "[]",
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
  };

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
      console.error("Gelen kutusu çekilemedi", e);
    }
  };

  const fetchChatHistory = async (otherUserId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/messages/history?user1Id=${currentUser.id}&user2Id=${otherUserId}`,
      );
      if (res.ok) {
        const data = await res.json();
        const formattedMsgs = data.map((m: any) => ({
          id: m.id,
          text: m.content,
          isMine: m.sender.id === currentUser.id,
        }));
        setMessages(formattedMsgs);
      }
    } catch (e) {
      console.error("Mesaj geçmişi çekilemedi", e);
    }
  };

  // 1. Sayfa Yüklendiğinde Verileri Çek
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      const likes = JSON.parse(
        localStorage.getItem(`likes_${parsedUser.email}`) || "[]",
      );
      setIsLiked(likes.includes(Number(id)));

      updateNotificationCount(parsedUser.id);
      fetchInbox(parsedUser.id);

      window.addEventListener("notificationsSeen", () =>
        setNotificationsCount(0),
      );
    }

    fetch("https://unicycle-api.onrender.com/api/products")
      .then((res) => res.json())
      .then((data) => {
        const foundProduct = data.find((p: any) => p.id.toString() === id);
        setProduct(foundProduct);
        setLoading(false);
        fetchComments();
        fetchLikeCount();
      })
      .catch((err) => {
        console.error("Hata:", err);
        setLoading(false);
      });

    return () =>
      window.removeEventListener("notificationsSeen", () =>
        setNotificationsCount(0),
      );
  }, [id]);

  // 🚀 SQL: BEĞENİ SAYISINI ÇEKME MOTORU
  const fetchLikeCount = async () => {
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/interaction/likes/count/${id}`,
      );
      if (res.ok) {
        const count = await res.json();
        setLikeCount(count);
      }
    } catch (err) {
      console.error("Beğeni sayısı çekilemedi:", err);
    }
  };

  // 🚀 CANLI ARAMA ETKİSİ
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
            const data = await userRes.json();
            if (Array.isArray(data))
              combined = data.map((u: any) => ({ type: "user", item: u }));
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
        console.error("Canlı arama hatası:", error);
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/comments/product/${id}`,
      );
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleMessageClick = () => {
    if (!currentUser) return showToast("🔒 Mesaj atmak için giriş yapmalısın!");
    if (product && product.user) {
      openChatWith({ id: product.user.id, name: product.user.fullName });
    }
  };

  // 🔗 PAYLAŞMA MOTORU
  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.title,
      text: `UniCycle'da bu ilana göz at: ${product.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Paylaşım iptal edildi veya hata:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("🔗 İlan linki panoya kopyalandı!");
    }
  };

  // ❤️ BEĞENME VE BİLDİRİM MOTORU
  const handleLikeToggle = async () => {
    if (!currentUser) {
      showToast("🔒 Beğenmek için giriş yapmalısın!");
      return;
    }

    const currentLikes = JSON.parse(
      localStorage.getItem(`likes_${currentUser.email}`) || "[]",
    );
    let newLikes;

    if (isLiked) {
      newLikes = currentLikes.filter((favId: number) => favId !== Number(id));
      setLikeCount((prev) => Math.max(0, prev - 1));
      showToast("💔 İlan favorilerden çıkarıldı!");

      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/interaction/likes?userId=${currentUser.id}&productId=${id}`,
          { method: "DELETE" },
        );
      } catch (err) {
        console.error("Beğeni veritabanından silinemedi:", err);
      }
    } else {
      newLikes = [...currentLikes, Number(id)];
      setLikeCount((prev) => prev + 1);
      showToast("❤️ İlan favorilere eklendi!");

      try {
        await fetch("https://unicycle-api.onrender.com/api/interaction/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            productId: Number(id),
          }),
        });
      } catch (err) {
        console.error("Beğeni veritabanına kaydedilemedi:", err);
      }

      if (product && product.user && product.user.id !== currentUser.id) {
        try {
          await fetch(
            "https://unicycle-api.onrender.com/api/interaction/notifications",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: product.user.id,
                message: `${currentUser.fullName}, "${product.title}" ilanını beğendi.`,
              }),
            },
          );
        } catch (err) {
          console.error("Bildirim gönderilemedi:", err);
        }
      }
    }

    localStorage.setItem(
      `likes_${currentUser.email}`,
      JSON.stringify(newLikes),
    );
    setIsLiked(!isLiked);
  };

  // 💬 YORUM EKLEME MOTORU
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser)
      return showToast("🔒 Yorum yapmak için giriş yapmalısın!");
    if (newComment.trim() === "") return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(
        "https://unicycle-api.onrender.com/api/comments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            productId: Number(id),
            text: newComment,
          }),
        },
      );
      if (res.ok) {
        setNewComment("");
        fetchComments();
        showToast("✅ Yorum başarıyla eklendi!");
        if (product && product.user && product.user.id !== currentUser.id) {
          try {
            await fetch(
              "https://unicycle-api.onrender.com/api/interaction/notifications",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: product.user.id,
                  message: `${currentUser.fullName}, "${product.title}" ilanına bir yorum yaptı.`,
                }),
              },
            );
          } catch (err) {
            console.error("Bildirim gönderilemedi:", err);
          }
        }
      }
    } catch (err) {
      console.error("Yorum eklenemedi", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        fetchComments();
        showToast("🗑️ Yorum silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("tr-TR") +
      " " +
      date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const openChatWith = (chatUser: { id: number; name: string }) => {
    setActiveChatUser(chatUser);
    setIsMessagesListOpen(false);
    fetchChatHistory(chatUser.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser || !activeChatUser) return;

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
            senderId: currentUser.id,
            receiverId: activeChatUser.id,
            content: content,
          }),
        },
      );
      if (res.ok) {
        fetchChatHistory(activeChatUser.id);
        fetchInbox(currentUser.id);
      }
    } catch (e) {
      console.error("Mesaj gönderilemedi", e);
    }
  };

  // Polling: inbox ve aktif chat güncelleme
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentUser) {
      interval = setInterval(() => {
        fetchInbox(currentUser.id);
        if (activeChatUser) {
          fetchChatHistory(activeChatUser.id);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentUser, activeChatUser]);

  // Chat penceresini en alta kaydır
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeChatUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin text-4xl sm:text-5xl">⏳</div>
      </div>
    );
  }

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          İlan bulunamadı!
        </h2>
        <Link
          href="/"
          className="mt-4 text-blue-600 font-bold hover:underline text-sm sm:text-base"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    );

  const photos =
    product.photosBase64 && product.photosBase64.length > 0
      ? product.photosBase64
      : ["https://via.placeholder.com/800x600?text=Fotograf+Yok"];
  const sellerName = product.user?.fullName || "Bilinmeyen Satıcı";
  const isOwner =
    currentUser &&
    product.user &&
    Number(currentUser.id) === Number(product.user.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative w-full overflow-x-hidden flex flex-col">
      {/* 🌟 BİLDİRİM (TOAST) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-xs sm:text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 ÜST MENÜ NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-6 pt-1 sm:pt-0">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform group cursor-pointer"
              >
                <Image
                  src="/logo.jpeg"
                  alt="UniCycle İkon"
                  width={36}
                  height={36}
                  className="object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all rounded-md sm:w-[52px] sm:h-[52px]"
                  priority
                />
                <span className="text-xl sm:text-[32px] font-extrabold tracking-tight text-slate-800">
                  Uni<span className="text-[#20B2AA]">Cycle</span>
                </span>
              </Link>
            </div>

            {/* Desktop Arama */}
            <div className="hidden md:flex flex-1 max-w-3xl relative group z-50 px-8">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Ürün, @üye veya ders notu ara..."
                  className="w-full bg-slate-100 text-slate-800 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent font-medium"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                <span className="absolute left-5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  🔍
                </span>
                <button type="submit" className="hidden">
                  Ara
                </button>
              </form>

              {isDropdownOpen && liveResults.length > 0 && (
                <div className="absolute top-full left-8 right-8 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
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
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {result.item.fullName || result.item.title}
                        </div>
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

            {/* Sağ Butonlar */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
              <Link
                href="/create-listing"
                className="hidden md:flex font-black text-[#20B2AA] hover:text-blue-800 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>

              {currentUser ? (
                <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                  {/* Bildirimler */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors shrink-0"
                      title="Bildirimler"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        ></path>
                      </svg>
                      {notificationsCount > 0 && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
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
                              } else if (
                                msgLower.includes("ilan") ||
                                msgLower.includes("ekledi")
                              ) {
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
                              } else if (msgLower.includes("yorum")) {
                                icon = "💬";
                                bg = "bg-green-100";
                                text = "text-green-600";
                              }

                              return (
                                <div
                                  key={notif.id}
                                  className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex gap-3 items-center"
                                >
                                  <div
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${bg} flex items-center justify-center ${text} text-base sm:text-lg shrink-0`}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs sm:text-sm text-slate-700">
                                      {notif.message}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
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

                  {/* Profil */}
                  <Link
                    href="/profile"
                    className="flex flex-col items-center justify-center text-slate-600 hover:text-blue-600 w-9 h-9 sm:w-auto sm:h-auto transition-all shrink-0"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      ></path>
                    </svg>
                    <span className="hidden sm:block text-[10px] font-medium mt-0.5">
                      Hesabım
                    </span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors text-xs shrink-0"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>

          {/* Mobil Arama */}
          <div className="md:hidden pb-3 pt-1 w-full relative z-40">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Ürün, kategori veya ders notu ara..."
                className="w-full bg-[#F3F4F6] text-slate-800 rounded-md py-2.5 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all border border-transparent font-medium text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-lg">
                🔍
              </span>
            </form>
            {isDropdownOpen && liveResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
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
        </div>
      </header>

      {/* 🖥️ ANA DÜZEN */}
      <div className="max-w-[1200px] mx-auto mt-4 sm:mt-8 px-4 sm:px-6 w-full">
        {/* Breadcrumb + Geri */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-semibold text-slate-400 overflow-hidden whitespace-nowrap flex-1">
            <Link
              href="/"
              className="hover:text-blue-600 transition-colors shrink-0"
            >
              Ana Sayfa
            </Link>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-slate-600 shrink-0">{product.category}</span>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-slate-800 truncate max-w-[120px] sm:max-w-[200px]">
              {product.title}
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-[11px] sm:text-sm shrink-0 pl-2"
          >
            <span>&larr;</span> Geri Dön
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Sol Kolon */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Fotoğraf Galerisi */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <div className="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[4/3] bg-slate-50 rounded-xl sm:rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-100">
                <img
                  src={photos[activeImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-2 custom-scrollbar">
                  {photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? "border-blue-600 shadow-md scale-105" : "border-transparent hover:border-blue-300 opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={photo}
                        className="w-full h-full object-cover"
                        alt={`Küçük foto ${index}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Açıklama */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-3 sm:mb-4 border-b pb-3 sm:pb-4">
                İlan Açıklaması
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {product.description ||
                  "Satıcı bu ilan için henüz bir açıklama girmemiş."}
              </p>
            </div>

            {/* Yorumlar */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
                <MessageSquare className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />
                <h3 className="text-lg sm:text-xl font-black text-slate-800">
                  Soru ve Yorumlar
                </h3>
                <span className="bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full text-xs sm:text-sm">
                  {comments.length}
                </span>
              </div>

              <form
                onSubmit={handleAddComment}
                className="mb-6 sm:mb-8 flex gap-2 sm:gap-3"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black shrink-0 text-sm sm:text-base">
                  {currentUser
                    ? currentUser.fullName.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Satıcıya bir soru sor..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-3 sm:pl-4 pr-10 sm:pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-xs sm:text-sm text-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-blue-500 hover:text-blue-700 disabled:text-slate-300 transition-colors"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </form>

              <div className="space-y-3 sm:space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 font-medium py-3 sm:py-4 text-xs sm:text-sm">
                    Henüz yorum yapılmamış. İlk soruyu sen sor!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const commentUser =
                      comment.user?.fullName || "Bilinmeyen Kullanıcı";
                    const canDelete =
                      currentUser &&
                      (currentUser.id === comment.user?.id || isOwner);

                    return (
                      <div
                        key={comment.id}
                        className="flex gap-2 sm:gap-4 group relative"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-1 text-xs sm:text-base">
                          {commentUser.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl rounded-tl-none border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-slate-800 text-xs sm:text-sm capitalize">
                              {commentUser}
                              {comment.user?.id === product.user?.id && (
                                <span className="bg-blue-100 text-blue-700 text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Satıcı
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] sm:text-xs font-semibold text-slate-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs sm:text-sm font-medium">
                            {comment.text}
                          </p>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute top-1 sm:top-2 right-[-5px] sm:right-[-10px] opacity-100 lg:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all bg-white p-1 sm:p-1.5 rounded-md shadow-sm border border-slate-100 text-xs sm:text-base"
                            title="Yorumu Sil"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            {/* Fiyat & Aksiyonlar */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight mb-3 sm:mb-4">
                {product.title}
              </h1>

              <div className="mb-4 sm:mb-6">
                {product.priceType === "fiyat" && (
                  <div className="text-3xl sm:text-4xl font-black text-blue-600">
                    {product.price}{" "}
                    <span className="text-xl sm:text-2xl text-blue-400">₺</span>
                  </div>
                )}
                {product.priceType === "takas" && (
                  <div className="text-2xl sm:text-3xl font-black text-purple-600 flex items-center gap-2">
                    🤝 Takasa Açık
                  </div>
                )}
                {product.priceType === "ucretsiz" && (
                  <div className="text-2xl sm:text-3xl font-black text-green-600 flex items-center gap-2">
                    🎁 Ücretsiz
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4 border-t border-slate-100 pt-4 sm:pt-6 mb-6 sm:mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                    Kategori
                  </span>
                  <span className="text-slate-800 font-bold bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                    {product.category}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                    Durum
                  </span>
                  <span className="text-slate-800 font-bold bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                    {product.itemCondition || "Belirtilmemiş"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                    İlan No
                  </span>
                  <span className="text-slate-400 font-bold text-xs sm:text-sm">
                    #{product.id}
                  </span>
                </div>
              </div>

              {/* 🔥 YENİ NESİL PREMIUM BÖLÜNMÜŞ (SPLIT) FAVORİ BUTONU */}
              <div className="flex flex-row gap-2 sm:gap-3 mt-4">
                {/* Beğeni Grubu (Tamamı Tıklanabilir) */}
                <div
                  onClick={handleLikeToggle}
                  className={`flex-[3] flex rounded-xl overflow-hidden border transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md group ${
                    isLiked
                      ? "border-red-200"
                      : "border-slate-200 hover:border-red-300"
                  }`}
                >
                  {/* Sol Taraf: İkon ve Yazı */}
                  <div
                    className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-colors ${
                      isLiked
                        ? "bg-red-50 text-red-600 border-r border-red-200"
                        : "bg-white text-slate-600 border-r border-slate-100 group-hover:bg-red-50"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${isLiked ? "fill-current text-red-500" : "text-slate-400 group-hover:text-red-400"}`}
                    />
                    <span className="tracking-wide whitespace-nowrap">
                      {isLiked ? "Favorilerde" : "Favoriye Al"}
                    </span>
                  </div>

                  {/* Sağ Taraf: Sayaç (Rozet Görünümü) */}
                  <div
                    className={`flex items-center justify-center px-3 sm:px-5 font-black text-xs sm:text-sm tabular-nums transition-colors ${
                      isLiked
                        ? "bg-red-500 text-white"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {likeCount}
                  </div>
                </div>

                {/* 🔥 YENİ PAYLAŞ BUTONU (Fonksiyon Bağlandı) */}
                <button
                  onClick={handleShare}
                  className="flex-[2] bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm border border-slate-200 transition-all shadow-sm hover:shadow-md"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />{" "}
                  <span className="whitespace-nowrap">Paylaş</span>
                </button>
              </div>
            </div>

            {/* Satıcı Kartı */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <Link
                href={`/user/${product.user?.id}`}
                className="flex items-center gap-3 sm:gap-4 group border-b border-slate-100 pb-4 sm:pb-6 mb-4 sm:mb-6 hover:bg-slate-50 p-2 sm:p-3 -mx-2 sm:-mx-3 rounded-2xl transition-all cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 capitalize group-hover:text-blue-600 transition-colors line-clamp-1">
                    {sellerName}
                  </h3>
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-400 mt-0.5 sm:mt-1">
                    <ShieldCheck
                      size={14}
                      className="text-green-500 sm:w-4 sm:h-4"
                    />{" "}
                    Kampüs Onaylı
                  </div>
                </div>
              </Link>

              {isOwner ? (
                <div className="w-full bg-green-50 text-green-700 font-black py-3 sm:py-4 rounded-xl border border-green-200 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm">
                  <span>✨</span> Bu senin ilanın
                </div>
              ) : (
                <button
                  onClick={handleMessageClick}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 sm:py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base"
                >
                  Satıcıya Mesaj Gönder
                </button>
              )}

              <div className="mt-3 sm:mt-4 text-center text-[10px] sm:text-xs font-bold text-slate-400 flex items-center justify-center gap-1 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Piri Reis
                Kampüsü
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 💬 GERÇEK VERİTABANI İLE MESAJLAŞMA (INBOX) SİSTEMİ */}
      {!isMessagesListOpen && !activeChatUser && (
        <button
          onClick={() => setIsMessagesListOpen(true)}
          className="fixed bottom-6 right-4 sm:right-6 z-[9990] bg-blue-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-blue-700 transition-all group"
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 group-hover:animate-pulse"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            ></path>
          </svg>
          {totalUnreadMessages > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 w-4 h-4 sm:w-5 sm:h-5 text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {totalUnreadMessages}
            </span>
          )}
        </button>
      )}

      {isMessagesListOpen && (
        <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-80 md:w-[350px] h-[55vh] sm:h-[450px] bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.15)] sm:shadow-2xl border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10 overflow-hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-5 py-4 sm:py-4 flex justify-between items-center shadow-md relative pt-6 sm:pt-4">
            <div className="w-12 h-1.5 bg-white/40 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden z-50"></div>
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
              💬 Mesajlar
            </h3>
            <button
              onClick={() => setIsMessagesListOpen(false)}
              className="text-white/80 hover:text-white font-bold text-2xl sm:text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-slate-100 bg-white custom-scrollbar">
            {inboxChats.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-16 font-medium px-4">
                Henüz mesajın yok. İlk adımı sen at!
              </div>
            ) : (
              inboxChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => openChatWith(chat)}
                  className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 border border-blue-200 text-sm sm:text-base shrink-0">
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span
                        className={`font-bold truncate text-sm ${chat.unread > 0 ? "text-slate-900" : "text-slate-700"}`}
                      >
                        {chat.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                        {new Date(chat.time).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                        className={`text-xs truncate ${chat.unread > 0 ? "font-bold text-slate-800" : "text-slate-500"}`}
                      >
                        {chat.lastMsg}
                      </p>
                      {chat.unread > 0 && (
                        <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ml-2 shrink-0">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeChatUser && (
        <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-80 md:w-[350px] h-[55vh] sm:h-[450px] bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.15)] sm:shadow-2xl border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10 overflow-hidden">
          <div className="bg-blue-600 text-white px-4 sm:px-5 py-4 sm:py-4 flex justify-between items-center shadow-md relative pt-6 sm:pt-4">
            <div className="w-12 h-1.5 bg-white/40 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden z-50"></div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setActiveChatUser(null);
                  setIsMessagesListOpen(true);
                }}
                className="text-white/80 hover:text-white mr-0.5 sm:mr-1 font-black text-2xl sm:text-xl"
              >
                &larr;
              </button>
              <div className="relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-white/30">
                  {activeChatUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm leading-none">
                  {activeChatUser.name}
                </h3>
                <span className="text-[9px] sm:text-[10px] text-blue-100">
                  Çevrimiçi
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveChatUser(null)}
              className="text-white/80 hover:text-white transition-colors font-bold text-2xl sm:text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div
            ref={chatScrollRef}
            className="flex-1 bg-slate-50 p-3 sm:p-4 overflow-y-auto flex flex-col gap-2 sm:gap-3 custom-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="text-center text-[10px] sm:text-xs text-slate-400 font-bold bg-slate-100 rounded-full w-max mx-auto px-4 py-1.5 mb-2">
                Henüz mesaj yok. İlk adımı sen at!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 text-xs sm:text-[13px] shadow-sm ${msg.isMine ? "bg-blue-600 text-white self-end rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 self-start rounded-bl-sm"}`}
                >
                  {msg.text}
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2 mb-1 sm:mb-0"
          >
            <input
              type="text"
              placeholder="Bir mesaj yaz..."
              className="flex-1 bg-slate-100 text-slate-800 text-sm sm:text-sm px-4 sm:px-4 py-3 sm:py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-12 h-12 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
            >
              <svg
                className="w-5 h-5 sm:w-5 sm:h-5 ml-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                ></path>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* 🌊 FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 sm:py-12 px-6 mt-10 sm:mt-16 rounded-t-[2rem] sm:rounded-t-[3rem] shadow-sm w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-1 md:col-span-2 text-center md:text-left">
            <div className="mb-2 sm:mb-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm mx-auto md:mx-0">
              Kampüs içindeki güvenli 2. el pazar yerin. Sadece üniversite
              öğrencilerine özel, doğrulanmış ve güvenilir alışveriş deneyimi.
            </p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-slate-800 font-bold mb-2 sm:mb-4 text-sm sm:text-base">
              Platform
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-slate-500">
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
          <div className="text-center md:text-left">
            <h4 className="text-slate-800 font-bold mb-2 sm:mb-4 text-sm sm:text-base">
              İletişim
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-slate-500">
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
        <div className="max-w-[1400px] mx-auto mt-6 sm:mt-12 pt-4 sm:pt-8 border-t border-slate-100 text-center text-[10px] sm:text-xs font-medium text-slate-400">
          © 2026 UniCycle. Tüm hakları saklıdır.
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-scrollbar::-webkit-scrollbar { height: 6px; } @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { height: 8px; } } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }`,
        }}
      />
    </div>
  );
}
