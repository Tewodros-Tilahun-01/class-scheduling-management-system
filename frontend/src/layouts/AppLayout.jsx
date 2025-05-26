import LoadingOverlay from "../components/ui/LoadingOverlay";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { MenuProvider } from "../hooks/MenuProvider";
import ThemeLayout from "./ThemeLayout";
import { NotificationProvider } from "@/context/NotificationContext";

const AppLayoutContent = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};

const AppLayout = ({ children }) => (
  <AuthProvider>
    <NotificationProvider>
      <ThemeLayout>
        <MenuProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </MenuProvider>
      </ThemeLayout>
    </NotificationProvider>
  </AuthProvider>
);

export default AppLayout;
