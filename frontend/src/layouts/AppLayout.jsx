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
    <ThemeLayout>
      <NotificationProvider>
        <MenuProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </MenuProvider>
      </NotificationProvider>
    </ThemeLayout>
  </AuthProvider>
);

export default AppLayout;
