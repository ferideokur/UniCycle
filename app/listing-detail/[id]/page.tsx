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
  const [likeCount, setLikeCount] = useState(0); // Toplam Beğeni Sayısı
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

  // 🔔 Navbar sayacını güncelleyen akıllı fonksiyon (CANLI ADRES)
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

  // 🚀 SAYFA BAŞLANGIÇ MOTORU
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

  // 🔍 CANLI ARAMA ETKİSİ
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

  const openChatWith = (chatUser: { id: number; name: string }) => {
    setActiveChatUser(chatUser);
    setIsMessagesListOpen(false);
    fetchChatHistory(chatUser.id);
  };

  const handleMessageClick = () => {
    if (!currentUser) return showToast("🔒 Mesaj atmak için giriş yapmalısın!");
    if (product && product.user) {
      openChatWith({ id: product.user.id, name: product.user.fullName });
    }
  };

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
        console.error(err);
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
        console.error(err);
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
          console.error(err);
        }
      }
    }
    localStorage.setItem(
      `likes_${currentUser.email}`,
      JSON.stringify(newLikes),
    );
    setIsLiked(!isLiked);
  };

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
            console.error(err);
          }
        }
      }
    } catch (err) {
      console.error(err);
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
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentUser) {
      interval = setInterval(() => {
        fetchInbox(currentUser.id);
        if (activeChatUser) fetchChatHistory(activeChatUser.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentUser, activeChatUser]);

  useEffect(() => {
    if (chatScrollRef.current)
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, activeChatUser]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("tr-TR") +
      " " +
      date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin text-4xl sm:text-5xl">⏳</div>
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          İlan bulunamadı!
        </h2>
        <Link href="/" className="mt-4 text-blue-600 font-bold hover:underline">
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
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-xs sm:text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-6">
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
                  className="object-contain rounded-md sm:w-[52px] sm:h-[52px]"
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
                  placeholder="Ürün veya @üye ara..."
                  className="w-full bg-slate-100 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                />
                <span className="absolute left-5 top-3.5 text-slate-400">
                  🔍
                </span>
              </form>
            </div>
            {/* Sağ Butonlar */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <Link
                href="/create-listing"
                className="hidden md:flex font-black text-[#20B2AA] items-center gap-1"
              >
                + İlan Ver
              </Link>
              {currentUser ? (
                <div className="flex items-center gap-1 sm:gap-4">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {notificationsCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                        {notificationsCount}
                      </span>
                    )}
                  </button>
                  <Link
                    href="/profile"
                    className="flex flex-col items-center text-slate-600"
                  >
                    <span className="hidden sm:block text-[10px] font-medium">
                      Hesabım
                    </span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-xs"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🖥️ ANA İÇERİK */}
      <div className="max-w-[1200px] mx-auto mt-4 sm:mt-8 px-4 sm:px-6 w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-semibold text-slate-400 overflow-hidden whitespace-nowrap flex-1">
            <Link href="/" className="hover:text-blue-600 shrink-0">
              Ana Sayfa
            </Link>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-slate-600 shrink-0">{product.category}</span>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-slate-800 truncate max-w-[120px]">
              {product.title}
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="font-bold text-slate-500 flex items-center gap-1 text-[11px] sm:text-sm shrink-0"
          >
            &larr; Geri Dön
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Sol Kolon: Fotoğraf + Açıklama + Yorumlar */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative flex items-center justify-center">
                <img
                  src={photos[activeImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-3 border-b pb-3">
                İlan Açıklaması
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                {product.description || "Açıklama yok."}
              </p>
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                <MessageSquare className="text-blue-500 w-5 h-5" />
                <h3 className="text-lg sm:text-xl font-black text-slate-800">
                  Soru ve Yorumlar
                </h3>
                <span className="bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full text-xs">
                  {comments.length}
                </span>
              </div>
              {/* Yorum Formu */}
              <form onSubmit={handleAddComment} className="mb-6 flex gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black shrink-0">
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
                    className="w-full bg-slate-50 border rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-blue-500"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
              {/* Yorum Listesi */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-2 sm:gap-4 group relative"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold shrink-0">
                      {comment.user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs">
                          {comment.user?.fullName}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm">
                        {comment.text}
                      </p>
                    </div>
                    {currentUser &&
                      (currentUser.id === comment.user?.id || isOwner) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-400 hover:text-red-600 transition-all text-xs sm:text-sm"
                        >
                          🗑️
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Fiyat + Satıcı Bilgisi */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight mb-3">
                {product.title}
              </h1>
              <div className="mb-4">
                <div className="text-3xl font-black text-blue-600">
                  {product.priceType === "fiyat"
                    ? `${product.price} ₺`
                    : product.priceType === "takas"
                      ? "🤝 Takas"
                      : "🎁 Ücretsiz"}
                </div>
              </div>
              <div className="flex flex-row gap-2">
                <button
                  onClick={handleLikeToggle}
                  className={`flex-1 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm ${isLiked ? "bg-red-50 text-red-500" : "bg-red-50 text-red-500"}`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                  />{" "}
                  {isLiked ? "Çıkar" : "Favoriye Al"}
                </button>
                <button className="flex-1 bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <Share2 size={16} /> Paylaş
                </button>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <Link
                href={`/user/${product.user?.id}`}
                className="flex items-center gap-3 mb-4 hover:bg-slate-50 p-2 rounded-2xl"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-black">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-slate-800">
                    {sellerName}
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                    <ShieldCheck size={14} className="text-green-500" /> Onaylı
                  </div>
                </div>
              </Link>
              {isOwner ? (
                <div className="w-full bg-green-50 text-green-700 font-black py-3 rounded-xl text-center text-xs">
                  ✨ Senin İlanın
                </div>
              ) : (
                <button
                  onClick={handleMessageClick}
                  className="w-full bg-slate-800 text-white font-black py-3 rounded-xl shadow-lg text-sm"
                >
                  Satıcıya Mesaj Gönder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 💬 MESAJLAŞMA WIDGET'I (INBOX + CHAT) */}
      {!isMessagesListOpen && !activeChatUser && (
        <button
          onClick={() => setIsMessagesListOpen(true)}
          className="fixed bottom-6 right-6 z-[9990] bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all"
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
        <div className="fixed bottom-0 right-0 sm:right-8 w-full sm:w-80 h-[55vh] sm:h-[450px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10 overflow-hidden">
          <div className="bg-blue-600 text-white px-5 py-4 flex justify-between items-center shadow-md">
            <h3 className="font-bold">💬 Mesajlar</h3>
            <button
              onClick={() => setIsMessagesListOpen(false)}
              className="text-xl"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {inboxChats.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-16 px-4">
                Henüz mesajın yok.
              </div>
            ) : (
              inboxChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => openChatWith(chat)}
                  className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 shrink-0">
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold truncate text-sm">
                        {chat.name}
                      </span>
                    </div>
                    <p className="text-xs truncate text-slate-500">
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
        <div className="fixed bottom-0 right-0 sm:right-8 w-full sm:w-80 h-[55vh] sm:h-[450px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10 overflow-hidden">
          <div className="bg-blue-600 text-white px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveChatUser(null);
                  setIsMessagesListOpen(true);
                }}
                className="text-xl"
              >
                &larr;
              </button>
              <h3 className="font-bold text-sm">{activeChatUser.name}</h3>
            </div>
            <button onClick={() => setActiveChatUser(null)} className="text-xl">
              ✕
            </button>
          </div>
          <div
            ref={chatScrollRef}
            className="flex-1 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${msg.isMine ? "bg-blue-600 text-white self-end rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 self-start rounded-bl-sm"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Mesaj yaz..."
              className="flex-1 bg-slate-100 text-sm px-4 py-2 rounded-full focus:outline-none"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* 🌊 FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-10 rounded-t-[2rem] w-full text-center">
        <div className="mb-4">
          <span className="text-2xl font-extrabold text-slate-800">
            Uni<span className="text-[#20B2AA]">Cycle</span>
          </span>
        </div>
        <p className="text-xs font-medium text-slate-500 mb-6">
          Kampüsün en güvenli öğrenci pazaryeri.
        </p>
        <div className="border-t border-slate-100 pt-6 text-[10px] text-slate-400">
          © 2026 UniCycle. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}
