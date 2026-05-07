"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast"; 
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Ban, 
  Trash2, 
  FileText, 
  Search,
  ShieldCheck,
  Users,
  RefreshCw,
  AlertTriangle,
  X
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [docModal, setDocModal] = useState<{isOpen: boolean, url: string}>({isOpen: false, url: ""});

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "suspend" | "reactivate" | "delete" | "reject" | null;
    userId: number | null;
    title: string;
    desc: string;
    buttonText: string;
  }>({
    isOpen: false, type: null, userId: null, title: "", desc: "", buttonText: ""
  });

  // KESİN ÇALIŞAN, ANINDA KAPATAN BİLDİRİM FONKSİYONU
  const notify = (msg: string, type: "success" | "error") => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-in fade-in slide-in-from-bottom-4' : 'hidden'} max-w-sm w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex items-center p-3 gap-3 border border-slate-200 relative`}>
        {type === "success" ? (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <p className="flex-1 text-sm font-bold text-slate-800 leading-snug pr-10">{msg}</p>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast.remove(t.id);
          }}
          className="absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all z-50 focus:outline-none cursor-pointer"
          title="Kapat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    ), { duration: 4000 });
  };

  useEffect(() => {
    // 🚀🚀 HIZLANDIRMA: Önbellekte veri varsa ANINDA ekrana bas, bekletme! 🚀🚀
    const cachedPending = localStorage.getItem("admin_pendingUsers");
    const cachedActive = localStorage.getItem("admin_activeUsers");
    
    if (cachedPending || cachedActive) {
      if (cachedPending) setPendingUsers(JSON.parse(cachedPending));
      if (cachedActive) setActiveUsers(JSON.parse(cachedActive));
      setIsLoading(false); // Veri varsa anında göster
    }

    const fetchUsers = async () => {
      try {
        const [pendingRes, activeRes, suspendedRes] = await Promise.all([
          fetch("https://unicycle-api.onrender.com/api/users/status/PENDING"),
          fetch("https://unicycle-api.onrender.com/api/users/status/ACTIVE"),
          fetch("https://unicycle-api.onrender.com/api/users/status/SUSPENDED")
        ]);

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          const pUsers = Array.isArray(pendingData) ? pendingData : [];
          setPendingUsers(pUsers);
          localStorage.setItem("admin_pendingUsers", JSON.stringify(pUsers)); // Arka planda kaydet
        }

        let combinedUsers: any[] = [];
        
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (Array.isArray(activeData)) combinedUsers = [...combinedUsers, ...activeData];
        }
        
        if (suspendedRes.ok) {
          const suspendedData = await suspendedRes.json();
          if (Array.isArray(suspendedData)) combinedUsers = [...combinedUsers, ...suspendedData];
        }

        setActiveUsers(combinedUsers);
        localStorage.setItem("admin_activeUsers", JSON.stringify(combinedUsers)); // Arka planda kaydet
      } catch (error) {
        console.error("Kullanıcılar çekilirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`https://unicycle-api.onrender.com/api/users/${id}/approve`, { method: "PUT" });
      if (res.ok) {
        const userToApprove = pendingUsers.find(u => u.id === id);
        if (userToApprove) {
          const newPending = pendingUsers.filter(u => u.id !== id);
          const newActive = [...activeUsers, { ...userToApprove, status: "ACTIVE" }];
          
          setPendingUsers(newPending);
          setActiveUsers(newActive);
          
          localStorage.setItem("admin_pendingUsers", JSON.stringify(newPending));
          localStorage.setItem("admin_activeUsers", JSON.stringify(newActive));
          
          notify(`${userToApprove.fullName || "Kullanıcı"} başarıyla onaylandı! ✅`, "success"); 
        }
      }
    } catch (error) {
      notify("Sunucuya bağlanılamadı.", "error"); 
    }
  };

  const executeConfirmAction = async () => {
    const { type, userId } = confirmModal;
    if (!userId || !type) return;

    try {
      if (type === "reject") {
        const res = await fetch(`https://unicycle-api.onrender.com/api/users/${userId}`, { method: "DELETE" });
        if (res.ok) {
          const newPending = pendingUsers.filter(u => u.id !== userId);
          setPendingUsers(newPending);
          localStorage.setItem("admin_pendingUsers", JSON.stringify(newPending));
          notify("Kayıt talebi başarıyla reddedildi ve silindi.", "success"); 
        }
      } 
      else if (type === "suspend") {
        const res = await fetch(`https://unicycle-api.onrender.com/api/users/${userId}/suspend`, { method: "PUT" });
        if (res.ok) {
          const newActive = activeUsers.map(u => u.id === userId ? { ...u, status: "SUSPENDED" } : u);
          setActiveUsers(newActive);
          localStorage.setItem("admin_activeUsers", JSON.stringify(newActive));
          notify("Kullanıcı hesabı başarıyla askıya alındı. 🚫", "error"); 
        }
      } 
      else if (type === "reactivate") {
        const res = await fetch(`https://unicycle-api.onrender.com/api/users/${userId}/approve`, { method: "PUT" });
        if (res.ok) {
          const newActive = activeUsers.map(u => u.id === userId ? { ...u, status: "ACTIVE" } : u);
          setActiveUsers(newActive);
          localStorage.setItem("admin_activeUsers", JSON.stringify(newActive));
          notify("Kullanıcının erişim kısıtlaması başarıyla kaldırıldı. ✨", "success"); 
        }
      } 
      else if (type === "delete") {
        const res = await fetch(`https://unicycle-api.onrender.com/api/users/${userId}`, { method: "DELETE" });
        if (res.ok) {
          const newActive = activeUsers.filter(u => u.id !== userId);
          setActiveUsers(newActive);
          localStorage.setItem("admin_activeUsers", JSON.stringify(newActive));
          notify("Kullanıcı sistemden kalıcı olarak silindi. 🗑️", "success"); 
        } else {
          notify("Kullanıcı silinemedi.", "error"); 
        }
      }
    } catch (error) {
      notify("İşlem sırasında sunucuya bağlanılamadı.", "error");
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const openRejectModal = (id: number) => {
    setConfirmModal({
      isOpen: true, type: "reject", userId: id,
      title: "Talebi Reddet ❌",
      desc: "Bu kayıt talebini reddetmek ve sistemden kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Onaylıyor musunuz?",
      buttonText: "Reddet ve Sil"
    });
  };

  const openSuspendModal = (id: number) => {
    setConfirmModal({
      isOpen: true, type: "suspend", userId: id,
      title: "Hesabı Askıya Al 🛑",
      desc: "Bu kullanıcının hesabını askıya almak üzeresiniz. Kullanıcı platforma erişim sağlayamayacaktır. İşlemi onaylıyor musunuz?",
      buttonText: "Pasife Al"
    });
  };

  const openReactivateModal = (id: number) => {
    setConfirmModal({
      isOpen: true, type: "reactivate", userId: id,
      title: "Erişimi Geri Ver ✨",
      desc: "Bu kullanıcının hesabındaki kısıtlamayı kaldırmak üzeresiniz. Kullanıcı platformu tekrar tam yetkiyle kullanabilecektir.",
      buttonText: "Erişimi Aç"
    });
  };

  const openDeleteModal = (id: number) => {
    setConfirmModal({
      isOpen: true, type: "delete", userId: id,
      title: "Kritik Sistem Uyarısı 🚨",
      desc: "DİKKAT: Bu kullanıcıyı sistemden kalıcı olarak silmek üzeresiniz. Bu işlem kesinlikle geri alınamaz ve kullanıcıya ait tüm veriler (ilanlar, mesajlar vb.) kalıcı olarak yok edilir.",
      buttonText: "Kalıcı Olarak Sil"
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans p-4 sm:p-8 relative">
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* PROFESYONEL ONAY KUTUSU (MODAL) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 relative">
            
            <button 
             aria-label="Kapat"
             onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
             className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
             >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8 text-center mt-2">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-yellow-500">
                <AlertTriangle className="w-8 h-8 text-black" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                {confirmModal.desc}
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-4 sm:p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 px-4 py-3 rounded-xl font-black text-black bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-sm focus:outline-none"
              >
                İptal Et
              </button>
              <button
                onClick={executeConfirmAction}
                className="flex-1 px-4 py-3 rounded-xl font-black text-white transition-all shadow-md focus:outline-none focus:ring-4 bg-orange-500 hover:bg-orange-600 focus:ring-orange-500/30"
              >
                {confirmModal.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BELGE GÖRÜNTÜLEME PENCERESİ (MODAL) */}
      {docModal.isOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <FileText className="w-6 h-6 text-[#20B2AA]" />
                Öğrenci Belgesi
              </h3>
              <button
                onClick={() => setDocModal({ isOpen: false, url: "" })}
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 rounded-full transition-colors font-bold text-slate-500 shadow-sm"
                title="Kapat"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-slate-200/50 flex items-center justify-center min-h-[50vh]">
              {docModal.url.startsWith("data:application/pdf") ? (
                <iframe 
                  src={docModal.url} 
                  className="w-full h-[70vh] rounded-xl shadow-sm border border-slate-200 bg-white" 
                  title="PDF Görüntüleyici"
                />
              ) : (
                <img 
                  src={docModal.url} 
                  alt="Öğrenci Belgesi" 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Link href="/profile" className="text-slate-500 hover:text-[#20B2AA] flex items-center gap-2 mb-2 text-sm transition-colors w-max font-bold">
              <ArrowLeft className="w-4 h-4" /> Profile Dön
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <ShieldCheck className="w-8 h-8 text-[#20B2AA]" />
              Yönetim Paneli
            </h1>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "pending" ? "bg-[#20B2AA] text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Bekleyen Onaylar ({pendingUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "active" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Kullanıcı Listesi ({activeUsers.length})
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
          {/* 🚀 KUM SAATİ SİLİNDİ, YERİNE ANINDA AÇILAN ZARİF İSKELET YÜKLEYİCİ EKLENDİ 🚀 */}
          {isLoading ? (
            <div className="w-full p-4 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-lg mb-4 w-full"></div>
              <div className="h-16 bg-slate-50 rounded-xl mb-2 w-full"></div>
              <div className="h-16 bg-slate-50 rounded-xl mb-2 w-full"></div>
              <div className="h-16 bg-slate-50 rounded-xl w-full"></div>
            </div>
          ) : (
            <>
              {activeTab === "pending" && (
                <div className="p-0 overflow-x-auto">
                  {pendingUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-medium bg-slate-50 h-full">
                      Bekleyen yeni kayıt talebi bulunmuyor.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Kullanıcı Bilgileri</th>
                          <th className="px-6 py-4">Üniversite</th>
                          <th className="px-6 py-4 text-center">Öğrenci Belgesi</th>
                          <th className="px-6 py-4 text-right">Aksiyonlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-base">{user.fullName || user.name}</div>
                              <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-semibold">{user.university || user.uni}</td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={async () => {
                                  // 🚀🚀 DOĞRUDAN VERİTABANINDAN ÇEKME TAKTİĞİ 🚀🚀
                                  try {
                                    const res = await fetch(`https://unicycle-api.onrender.com/api/users/${user.id}`);
                                    if (!res.ok) throw new Error("Ağ hatası");
                                    const fullUser = await res.json();
                                    
                                    console.log("Sunucudan Gelen Detaylar:", fullUser);

                                    // Bildiğimiz tüm isimleri dene
                                    let docUrl = fullUser.documentBase64 || fullUser.documentUrl || fullUser.docUrl || 
                                                 fullUser.studentDocument || fullUser.studentCertificate || 
                                                 fullUser.studentCardBase64 || fullUser.document || fullUser.file || fullUser.image;
                                    
                                    // Bulamadıysa uzun şifreli metinleri (Base64) otomatik tara
                                    if (!docUrl) {
                                      for (const key in fullUser) {
                                        if (typeof fullUser[key] === 'string' && fullUser[key].length > 500) {
                                          docUrl = fullUser[key];
                                          break;
                                        }
                                      }
                                    }

                                    if(docUrl) {
                                      // Eksik formatları tamamla ve PDF/Resim ayrımını yap
                                      if (!docUrl.startsWith('http') && !docUrl.startsWith('data:')) {
                                        if (docUrl.startsWith('JVBERi0')) { // PDF dosyasının gizli imzası
                                            docUrl = 'data:application/pdf;base64,' + docUrl;
                                        } else {
                                            docUrl = 'data:image/jpeg;base64,' + docUrl;
                                        }
                                      }
                                      setDocModal({isOpen: true, url: docUrl});
                                    } else {
                                      notify("Veritabanında bu kullanıcıya ait bir belge bulunamadı.", "error");
                                    }
                                  } catch (error) {
                                    notify("Belge sunucudan indirilirken hata oluştu.", "error");
                                  }
                                }}
                                className="inline-flex items-center justify-center w-32 gap-1.5 text-[#20B2AA] hover:text-teal-700 bg-[#20B2AA]/10 hover:bg-[#20B2AA]/20 px-3 py-1.5 rounded-lg font-bold transition-colors text-xs cursor-pointer"
                              >
                                <FileText className="w-4 h-4" /> İncele
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleApprove(user.id)} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Onayla">
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button onClick={() => openRejectModal(user.id)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Reddet ve Sil">
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === "active" && (
                <div className="p-0">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="relative max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="İsim veya e-posta ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 w-1/3">Kullanıcı</th>
                          <th className="px-6 py-4 w-1/4">Üniversite</th>
                          <th className="px-6 py-4 w-32 text-center">Durum</th>
                          <th className="px-6 py-4 w-48 text-right">Yönetim</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeUsers
                          .filter(u => {
                            const name = (u.fullName || u.name || "").toLowerCase();
                            const email = (u.email || "").toLowerCase();
                            const search = searchTerm.toLowerCase();
                            return name.includes(search) || email.includes(search);
                          })
                          .map((user) => (
                          <tr key={user.id} className={`transition-colors ${user.status === 'SUSPENDED' ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="px-6 py-4 truncate">
                              <div className="font-bold text-slate-900 flex items-center gap-2 text-base truncate">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${user.status === 'SUSPENDED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{user.fullName || user.name}</span>
                              </div>
                              <div className="text-slate-500 text-xs mt-0.5 ml-9 truncate">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-semibold truncate">{user.university || user.uni}</td>
                            <td className="px-6 py-4 text-center">
                              {user.status === 'SUSPENDED' ? (
                                <span className="inline-flex items-center justify-center w-24 gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-red-100 text-red-700 border border-red-200 shadow-sm">
                                  YASAKLI
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-24 gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  AKTİF
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                
                                {user.status === 'SUSPENDED' ? (
                                  <button 
                                    onClick={() => openReactivateModal(user.id)}
                                    className="inline-flex items-center justify-center w-28 gap-1.5 text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 px-3 py-2 rounded-lg font-bold transition-all text-xs shadow-sm"
                                    title="Yasağı Kaldır"
                                  >
                                    <RefreshCw className="w-4 h-4" /> Geri Aç
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openSuspendModal(user.id)}
                                    className="inline-flex items-center justify-center w-28 gap-1.5 text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-500 px-3 py-2 rounded-lg font-bold transition-all text-xs shadow-sm"
                                    title="Pasife Al"
                                  >
                                    <Ban className="w-4 h-4" /> Pasife Al
                                  </button>
                                )}

                                <button 
                                  onClick={() => openDeleteModal(user.id)}
                                  className="inline-flex items-center justify-center w-20 gap-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-500 px-3 py-2 rounded-lg font-bold transition-all text-xs shadow-sm"
                                  title="Tamamen Sil"
                                >
                                  <Trash2 className="w-4 h-4" /> Sil
                                </button>

                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}