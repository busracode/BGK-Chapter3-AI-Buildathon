import { useState } from "react";
import SplashScreen from "./screens/SplashScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import JournalScreen from "./screens/JournalScreen";
import ProfileScreen from "./screens/ProfileScreen";
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

  const handleRegister = (registeredUser) => {
    setUser(registeredUser);
    setScreen("home");
  };

  const navItems = [
    { id: "home", label: "Ev", icon: "home" },
    { id: "chat", label: "Sohbet", icon: "chat" },
    { id: "journal", label: "Günlük", icon: "journal" },
    { id: "profile", label: "Profil", icon: "user" },
  ];

  return (
    <div className="min-h-screen bg-warmBg relative overflow-hidden">
      {screen === "splash" && <SplashScreen onRoleSelect={handleRoleSelect} />}
      
      {screen === "register" && (
        <RegisterScreen 
          role={role} 
          onSubmit={handleRegister} 
          onBack={() => setScreen("splash")} 
        />
      )}

      {["home", "chat", "journal", "profile"].includes(screen) && (
        <>
          {screen === "home" && (
            <HomeScreen
              user={user}
              onStartChat={(session) => {
                setActiveSession(session);
                setScreen("chat");
              }}
            />
          )}
          {screen === "chat" && (
            <ChatScreen
              session={activeSession}
              user={user}
              onBack={() => setScreen("home")}
            />
          )}
          {screen === "journal" && <JournalScreen user={user} />}
          {screen === "profile" && <ProfileScreen user={user} />}

          <BottomNav
            items={navItems}
            active={screen}
            onChange={setScreen}
          />
        </>
      )}
    </div>
  );
}
