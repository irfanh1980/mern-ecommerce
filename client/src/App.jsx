import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <AppRouter />
      </FavoritesProvider>
    </AuthProvider>
  );
}
