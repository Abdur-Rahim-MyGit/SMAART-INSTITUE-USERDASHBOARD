import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        style: {
          background: '#002147',
          border: '1px solid #1a3884',
          color: 'white',
          boxShadow: '0 0 15px rgba(26,56,132,0.3)',
        },
        classNames: {
          toast: "group toast bg-[#002147] text-white border-[#1a3884] shadow-[0_0_15px_rgba(26,56,132,0.3)]",
          description: "text-white/80",
          actionButton: "bg-[#1a3884] text-white",
          cancelButton: "bg-[#C0C0C0] text-[#002147]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };



