import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "@/components/LoginCard";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

const Institution = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#002147]"
    >
      <NeuralBackground theme={theme} />
      {/* Subtle background crest watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute right-[-5%] top-[8%] w-[520px] h-[520px] opacity-[0.03]"
          style={{
            backgroundImage: "url('/smaart-crest.png')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            filter: "grayscale(1) brightness(1.2)",
          }}
        />
        {/* Soft radial glows for light mode */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/50 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 opacity-50 blur-[100px]" />
      </div>

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 relative z-10">
        <LoginCard />
      </main>
    </div>
  );
};

export default Institution;
