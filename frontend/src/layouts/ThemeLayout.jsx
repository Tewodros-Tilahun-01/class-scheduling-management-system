import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export default function ThemeLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
