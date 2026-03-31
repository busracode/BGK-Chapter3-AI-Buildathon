import { useState, useRef, useEffect } from "react";

export default function ChatScreen({ session, user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(user?.role === "büyük");
  const [riskAlert, setRiskAlert] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const speakText = (text) => {
    window.speechSynthesis.cancel(); // Stop any current speaking
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 0.9; // Slightly slower for better clarity
    window.speechSynthesis.speak(utterance);
  };

  const checkAndAlertThreat = async (crisis_level, trigger_text) => {
    if (crisis_level === "kritik" || crisis_level === "uyarı") {
      try {
        await fetch("http://localhost:8000/api/moderation/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: session?.session_id || "demo_sess",
            user_id: user.id || "demo_user",
            crisis_level,
            trigger_text
          })
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchMessages = async () => {
    if (!session?.session_id) return;
    try {
      const resp = await fetch(`http://localhost:8000/api/chat/messages/${session.session_id}`);
      const data = await resp.json();
      
      const formatted = data.map(m => ({
        id: m.id,
        sender: m.sender_id === user.id ? "user" : "mentor", // We use "mentor" as the abstract "other person" for CSS styling
        text: m.text
      }));
      setMessages(formatted);
    } catch (e) {
      console.error("Fetch messages error", e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [session?.session_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText = input) => {
    if (!messageText || !user) return;
    
    // Optimistic Update
    const tempId = Date.now();
    const newMsg = { id: tempId, sender: "user", text: messageText };
    setMessages(prev => [...prev, newMsg]);
    if(messageText === input) setInput(""); 
    
    try {
      const resp = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session?.session_id || "demo_session",
          sender_id: user.id || "demo_user",
          text: messageText,
          sender_role: user.role || "genç"
        })
      });
      const data = await resp.json();
      
      if (data.is_risky) {
         setRiskAlert(true);
      }
      
      if (data.crisis_level && data.crisis_level !== "yok") {
         await checkAndAlertThreat(data.crisis_level, messageText);
      }
      
      // Polling will fetch the updated list including this message from the DB
      fetchMessages();

    } catch(e) {
      console.error("Message send failed:", e);
      // Remove temporary message if it totally failed to reach network
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Mesaj gönderilemedi, bağlantınızı kontrol edin.");
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanımayı desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false; 

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (e) => {
      let finalTranscript = "";
      for (let i = 0; i < e.results.length; i++) {
         finalTranscript += e.results[i][0].transcript;
      }
      setInput(finalTranscript);
      handleSend(finalTranscript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="flex flex-col h-screen bg-sage animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-borderSoft z-10 shadow-sm relative">
        <button onClick={onBack} className="p-2 text-textMuted active:scale-95 transition-transform">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mintLight border border-mintBorder flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-grass">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-serif font-bold text-textMain leading-tight">{session?.name || "Mentör M."}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-grass"></span>
              <span className="text-xs font-bold text-textMuted">Aktif</span>
            </div>
          </div>
        </div>
        
        <button className="w-10 h-10 rounded-full bg-mintLight flex items-center justify-center shadow-sm active:scale-95 transition-transform">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grass"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </button>
      </div>

      {riskAlert && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-6">
               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-red-50">
                 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-textMain">Yapay Zeka Uyarısı</h3>
                 <p className="text-textMuted font-bold leading-relaxed text-sm">Gönderdiğiniz mesaj güvenlik duvarımız tarafından hassas/riskli algılandı. Destek ister misiniz?</p>
               </div>
               <div className="flex gap-4 pt-2">
                 <button onClick={() => setRiskAlert(false)} className="flex-1 py-4 font-black rounded-2xl bg-gray-100 text-textMain active:scale-95 transition-all text-sm border-b-4 border-gray-300 active:border-b-0 active:translate-y-1">Geç</button>
                 <button onClick={() => { setRiskAlert(false); alert("Uzman ekibimize bildirim gönderildi. En kısa sürede iletişime geçeceğiz."); }} className="flex-1 py-4 font-black rounded-2xl bg-red-500 text-white active:scale-95 transition-all text-sm shadow-[0_5px_15px_rgba(239,68,68,0.3)] border-b-4 border-red-700 active:border-b-0 active:translate-y-1">Uzmana Sor</button>
               </div>
            </div>
          </div>
      )}

      {/* Security Banner */}
      <div className="bg-mintLight py-2 px-4 border-b border-mintMid flex items-center justify-center gap-2 z-10">
        <div className="w-5 h-5 rounded-full bg-grass flex items-center justify-center">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <span className="text-xs font-bold text-textMain tracking-wide">Uçtan Uca Yapay Zeka Moderasyonu Aktif</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-40">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} gap-3`}>
            <div className="flex items-center gap-3">
              {m.sender === "mentor" && (
                <div className="w-12 h-12 rounded-full bg-mintLight border-2 border-mintBorder flex items-center justify-center shrink-0">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-grass">
                     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                     <circle cx="12" cy="7" r="4" />
                   </svg>
                </div>
              )}
              
              <div className={`px-6 py-4 max-w-[85%] font-bold shadow-md text-xl relative group
                ${m.sender === "user" ? "bg-grass text-white rounded-[28px] rounded-br-[4px]" : "bg-white border-2 border-borderSoft text-textMain rounded-[28px] rounded-bl-[4px]"}`}>
                {m.text}
                
                {/* TTS Button */}
                <button 
                  onClick={() => speakText(m.text)}
                  className={`absolute -top-4 ${m.sender === 'user' ? '-left-6' : '-right-6'} w-12 h-12 bg-white border-2 border-mintBorder rounded-full flex items-center justify-center shadow-lg hover:bg-mintLight transition-all active:scale-90`}
                  title="Dinle"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-grass">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-[80px] left-0 w-full p-4 bg-white border-t-2 border-borderSoft flex gap-3 z-40 items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button 
          onClick={toggleRecording} 
          className={`shrink-0 w-[64px] h-[64px] flex items-center justify-center rounded-2xl border-4 transition-all shadow-md ${isRecording ? 'bg-red-500 border-red-700 text-white animate-pulse' : 'bg-mintLight border-mintBorder text-grass hover:bg-mintMid'}`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend(input)}
          className="input-soft flex-1 w-0 min-w-0 h-[64px] px-6 text-xl transition-all"
          placeholder="İletiniz..."
        />
        <button onClick={() => handleSend(input)} className="shrink-0 w-[64px] h-[64px] bg-grass rounded-2xl flex items-center justify-center text-white shadow-md active:scale-95 transition-transform border-b-[6px] border-forest active:border-b-0 active:translate-y-[6px]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
