import { useState } from "react";
import SplashScreen from "./screens/SplashScreen";
import RegisterScreen from "./screens/RegisterScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import ChatListScreen from "./screens/ChatListScreen";
import JournalScreen from "./screens/JournalScreen";
import ProfileScreen from "./screens/ProfileScreen";
import DiscoveryScreen from "./screens/DiscoveryScreen";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setScreen("register");
  };

  const handleLoginSelect = (selectedRole) => {
    setRole(selectedRole);
    setScreen("login");
  };

  const handleRegister = (registeredUser) => {
    setUser(registeredUser);
    setScreen("home");
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setScreen("splash");
  };

  const navItems = [
    { id: "home", label: "Ev", icon: "home" },
    { id: "chat", label: "Sohbet", icon: "chat" },
    { id: "journal", label: "Günlük", icon: "journal" },
    { id: "profile", label: "Profil", icon: "user" },
  ];

  return (
    <div className={`min-h-screen bg-warmBg relative overflow-hidden ${user?.role === 'büyük' ? 'elder-friendly' : ''}`}>
      {screen === "splash" && (
        <SplashScreen 
          onRoleSelect={handleRoleSelect} 
          onLoginSelect={handleLoginSelect} 
        />
      )}
      
      {screen === "register" && (
        <RegisterScreen 
          role={role} 
          onSubmit={handleRegister} 
          onBack={() => setScreen("splash")} 
        />
      )}

      {screen === "login" && (
        <LoginScreen
          role={role}
          onSubmit={handleRegister} // handles setting user and going to home
          onBack={() => setScreen("splash")}
        />
      )}

      {["home", "chat", "chat-detail", "journal", "profile", "discovery"].includes(screen) && (
        <>
          {screen === "home" && (
            <HomeScreen
              user={user}
              setUser={setUser}
              onStartChat={(session) => {
                setActiveSession(session);
                setScreen("chat-detail");
              }}
              onOpenDiscovery={() => setScreen("discovery")}
            />
          )}

          {screen === "discovery" && (
            <DiscoveryScreen 
              user={user} 
              onBack={() => setScreen("home")} 
            />
          )}

          {screen === "chat" && (
            <ChatListScreen
              user={user}
              onSelectChat={(session) => {
                setActiveSession(session);
                setScreen("chat-detail");
              }}
            />
          )}

          {screen === "chat-detail" && (
            <ChatScreen
              session={activeSession}
              user={user}
              onBack={() => setScreen("chat")}
            />
          )}

          {screen === "journal" && <JournalScreen user={user} />}
          {screen === "profile" && <ProfileScreen user={user} onLogout={handleLogout} />}

          <BottomNav
            items={navItems}
            active={screen === "chat-detail" ? "chat" : screen}
            onChange={setScreen}
          />
        </>
      )}
    </div>
  );
}
