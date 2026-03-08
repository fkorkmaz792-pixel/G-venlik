import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Lock, Search, Plus, LogOut, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function Chats() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      alert('Giriş yapılırken bir hata oluştu.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <MessageSquare size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Güvenli Sohbet</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Personel ve amirlerinizle güvenli bir şekilde mesajlaşmak, grup kurmak ve anlık iletişimde kalmak için giriş yapın.
        </p>
        <button 
          onClick={handleLogin}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md"
        >
          Google ile Giriş Yap
        </button>
      </div>
    );
  }

  if (!userData) {
    return <UsernameSetup user={user} onComplete={setUserData} />;
  }

  return <ChatInterface user={user} userData={userData} onLogout={handleLogout} />;
}

function UsernameSetup({ user, onComplete }: { user: FirebaseUser, onComplete: (data: any) => void }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    
    setSaving(true);
    try {
      // Check if username exists
      const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('Bu kullanıcı adı zaten alınmış.');
        setSaving(false);
        return;
      }

      const newUserData = {
        uid: user.uid,
        username: username.toLowerCase(),
        displayName: user.displayName || username,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), newUserData);
      onComplete(newUserData);
    } catch (err) {
      console.error(err);
      setError('Kaydedilirken bir hata oluştu.');
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Kullanıcı Adı Belirle</h2>
      <p className="text-gray-500 mb-6">Diğer personellerin sizi bulabilmesi için benzersiz bir kullanıcı adı seçin.</p>
      
      <form onSubmit={handleSave} className="w-full max-w-sm">
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          placeholder="Kullanıcı Adı (örn: ahmet_guvenlik)"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
          pattern="[a-zA-Z0-9_]+"
          title="Sadece harf, rakam ve alt çizgi kullanabilirsiniz."
        />
        {error && <p className="text-red-500 text-sm mb-4 text-left">{error}</p>}
        
        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 mt-4"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet ve Başla'}
        </button>
      </form>
    </div>
  );
}

function ChatInterface({ user, userData, onLogout }: { user: FirebaseUser, userData: any, onLogout: () => void }) {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Load user's chats
  useEffect(() => {
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user.uid]);

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
              {userData.username.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium truncate max-w-[120px]">@{userData.username}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowNewChat(true)} className="p-2 hover:bg-white/20 rounded-full" title="Yeni Mesaj">
              <Plus size={18} />
            </button>
            <button onClick={() => setShowNewGroup(true)} className="p-2 hover:bg-white/20 rounded-full" title="Yeni Grup">
              <UsersIcon size={18} />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-white/20 rounded-full" title="Çıkış Yap">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Henüz bir sohbetiniz yok. Üstteki + butonuna basarak yeni bir sohbet başlatın.
            </div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeChat?.id === chat.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {chat.type === 'group' ? <UsersIcon size={20} /> : <User size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">
                      {chat.type === 'group' ? chat.name : chat.participantNames?.[chat.participants.find((p: string) => p !== user.uid)] || 'Kullanıcı'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'Henüz mesaj yok'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <ActiveChatWindow chat={activeChat} user={user} onBack={() => setActiveChat(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Sohbet etmek için sol taraftan bir kişi veya grup seçin.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewChat && <NewChatModal user={user} userData={userData} onClose={() => setShowNewChat(false)} onChatCreated={setActiveChat} />}
      {showNewGroup && <NewGroupModal user={user} userData={userData} onClose={() => setShowNewGroup(false)} onGroupCreated={setActiveChat} />}
    </div>
  );
}

function ActiveChatWindow({ chat, user, onBack }: { chat: any, user: FirebaseUser, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, `chats/${chat.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgList);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [chat.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput('');

    try {
      await addDoc(collection(db, `chats/${chat.id}/messages`), {
        chatId: chat.id,
        senderId: user.uid,
        senderName: user.displayName || 'Kullanıcı',
        text: messageText,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp()
      });
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
    }
  };

  const chatName = chat.type === 'group' 
    ? chat.name 
    : chat.participantNames?.[chat.participants.find((p: string) => p !== user.uid)] || 'Kullanıcı';

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
          {chat.type === 'group' ? <UsersIcon size={20} /> : <User size={20} />}
        </div>
        <div>
          <h2 className="font-bold text-gray-800">{chatName}</h2>
          <p className="text-xs text-gray-500">{chat.type === 'group' ? 'Grup Sohbeti' : 'Özel Sohbet'}</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-[#F5F7FB] space-y-4">
        {messages.map((m, i) => {
          const isMe = m.senderId === user.uid;
          const showName = chat.type === 'group' && !isMe && (i === 0 || messages[i-1].senderId !== m.senderId);
          
          return (
            <div key={m.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
              {showName && <span className="text-xs text-gray-500 mb-1 ml-1 font-medium">{m.senderName}</span>}
              <div className={`px-4 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mesaj yazın..." 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={!input.trim()} className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100">
          <Send size={20} className="ml-1" />
        </button>
      </form>
    </div>
  );
}

function NewChatModal({ user, userData, onClose, onChatCreated }: { user: FirebaseUser, userData: any, onClose: () => void, onChatCreated: (chat: any) => void }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setSearching(true);
    try {
      const q = query(collection(db, 'users'), where('username', '>=', search.toLowerCase()), where('username', '<=', search.toLowerCase() + '\uf8ff'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => doc.data()).filter(u => u.uid !== user.uid);
      setResults(users);
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const startChat = async (targetUser: any) => {
    // Check if chat already exists
    const q = query(collection(db, 'chats'), where('type', '==', 'direct'), where('participants', 'array-contains', user.uid));
    const snapshot = await getDocs(q);
    
    let existingChat = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(targetUser.uid)) {
        existingChat = { id: doc.id, ...data };
      }
    });

    if (existingChat) {
      onChatCreated(existingChat);
      onClose();
      return;
    }

    // Create new chat
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'direct',
        participants: [user.uid, targetUser.uid],
        participantNames: {
          [user.uid]: userData.username,
          [targetUser.uid]: targetUser.username
        },
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp()
      });

      onChatCreated({
        id: chatRef.id,
        type: 'direct',
        participants: [user.uid, targetUser.uid],
        participantNames: {
          [user.uid]: userData.username,
          [targetUser.uid]: targetUser.username
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Sohbet başlatılamadı.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Yeni Mesaj</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><XIcon /></button>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kullanıcı adı ara..." 
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700">
            <Search size={20} />
          </button>
        </form>

        <div className="max-h-64 overflow-y-auto">
          {searching ? (
            <p className="text-center text-gray-500 py-4">Aranıyor...</p>
          ) : results.length > 0 ? (
            results.map(u => (
              <div key={u.uid} onClick={() => startChat(u)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-100">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800">@{u.username}</p>
                  <p className="text-xs text-gray-500">{u.displayName}</p>
                </div>
              </div>
            ))
          ) : search && !searching ? (
            <p className="text-center text-gray-500 py-4">Kullanıcı bulunamadı.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NewGroupModal({ user, userData, onClose, onGroupCreated }: { user: FirebaseUser, userData: any, onClose: () => void, onGroupCreated: (chat: any) => void }) {
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setSaving(true);
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'group',
        name: groupName.trim(),
        participants: [user.uid], // Initially just the creator, can add others later
        createdAt: serverTimestamp(),
        lastMessage: 'Grup oluşturuldu',
        lastMessageTime: serverTimestamp()
      });

      onGroupCreated({
        id: chatRef.id,
        type: 'group',
        name: groupName.trim(),
        participants: [user.uid]
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Grup oluşturulamadı.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Yeni Grup</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><XIcon /></button>
        </div>
        
        <form onSubmit={handleCreate}>
          <input 
            type="text" 
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Grup Adı (örn: Gece Vardiyası)" 
            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <button 
            type="submit" 
            disabled={!groupName.trim() || saving}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Oluşturuluyor...' : 'Grubu Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}

function XIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
