import AppRoutes from "./routes/AppRoutes";
import { GameProvider } from "./context/GameContext";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <GameProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </GameProvider>
  );
}

export default App;
