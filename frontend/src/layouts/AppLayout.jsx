import LoadingOverlay from "../components/ui/LoadingOverlay";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { MenuProvider } from "../hooks/MenuProvider";

const AppLayoutContent = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};

const AppLayout = ({ children }) => (
  <AuthProvider>
    <MenuProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </MenuProvider>
  </AuthProvider>
);

export default AppLayout;
