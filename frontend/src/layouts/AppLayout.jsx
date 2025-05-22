import LoadingOverlay from "../components/ui/LoadingOverlay";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { MenuProvider } from "../hooks/MenuProvider";
import ThemeLayout from "./ThemeLayout";

const AppLayoutContent = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};

const AppLayout = ({ children }) => (
  <AuthProvider>
    <ThemeLayout>
      <MenuProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </MenuProvider>
    </ThemeLayout>
  </AuthProvider>
);

export default AppLayout;
