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
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t-2 border-borderSoft flex gap-4 z-50 items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-12">
        <button 
          onClick={toggleRecording} 
          className={`w-16 h-16 flex items-center justify-center rounded-full border-4 transition-all shadow-xl ${isRecording ? 'bg-red-500 border-red-700 text-white animate-pulse' : 'bg-mintLight border-mintBorder text-grass hover:bg-mintMid'}`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
          className="input-soft flex-1 py-5 px-6 text-xl"
          placeholder="İletiniz..."
        />
        <button onClick={() => handleSend(input)} className="w-16 h-16 bg-grass rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform border-b-4 border-forest">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
