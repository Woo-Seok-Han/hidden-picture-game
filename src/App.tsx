import AdminApp from "./apps/admin/AdminApp";
import PlayerApp from "./apps/player/PlayerApp";

function App() {
  const isAdminPath =
    window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/");

  return isAdminPath ? <AdminApp /> : <PlayerApp />;
}

export default App;
