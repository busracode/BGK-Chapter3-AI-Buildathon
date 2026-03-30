import { useState, useRef, useEffect } from "react";

export default function ChatScreen({ session, user, onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: "mentor", text: "Merhaba, nasılsın? Bugün konuşalım mı?" }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(user?.role === "büyük");
  const recognitionRef = useRef(null);

  const speakText = (text) => {
    if (!voiceMode) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
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

  const handleSend = async (messageText = input) => {
    if (!messageText || !user) return;
    
    const newMsg = { id: Date.now(), sender: "user", text: messageText };
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
      
      if (data.crisis_level && data.crisis_level !== "yok") {
         await checkAndAlertThreat(data.crisis_level, messageText);
      }
      
      const replyText = data.reply || "Anlaşılamadı.";
      setMessages(prev => [...prev, { 
        id: Date.now()+1, 
        sender: "mentor", 
        text: replyText
      }]);

      speakText(replyText);

    } catch(e) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now()+1, sender: "mentor", text: "Bağlantı koptu. Lütfen tekrar dene." }]);
      }, 1000);
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

      {/* Security Banner */}
      <div className="bg-mintLight py-2 px-4 border-b border-mintMid flex items-center justify-center gap-2 z-10">
        <div className="w-5 h-5 rounded-full bg-grass flex items-center justify-center">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <span className="text-xs font-bold text-textMain tracking-wide">Uçtan Uca Yapay Zeka Moderasyonu Aktif</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
            {m.sender === "mentor" && (
              <div className="w-8 h-8 rounded-full bg-mintLight border border-mintBorder flex items-center justify-center shrink-0 mb-1">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-grass">
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                   <circle cx="12" cy="7" r="4" />
                 </svg>
              </div>
            )}
            <div className={`px-4 py-3 max-w-[75%] font-semibold shadow-sm text-[15px]
              ${m.sender === "user" ? "bg-grass text-white rounded-[20px] rounded-br-[4px]" : "bg-white border border-borderSoft text-textMain rounded-[20px] rounded-bl-[4px]"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-borderSoft flex gap-3 z-50 items-center pb-20 pt-4">
        <button 
          onClick={toggleRecording} 
          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ${isRecording ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' : 'bg-mintLight border-mintBorder text-grass'}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
        </button>
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend(input)}
          className="input-soft flex-1 py-3 px-5"
          placeholder="Bir mesaj yazın..."
        />
        <button onClick={() => handleSend(input)} className="w-12 h-12 bg-grass rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
