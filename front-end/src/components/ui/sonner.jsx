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
          border: '1px solid #30919D',
          color: 'white',
          boxShadow: '0 0 15px rgba(48,145,157,0.3)',
        },
        classNames: {
          toast: "group toast bg-[#002147] text-white border-[#30919D] shadow-[0_0_15px_rgba(48,145,157,0.3)]",
          description: "text-white/80",
          actionButton: "bg-[#30919D] text-white",
          cancelButton: "bg-[#daa520] text-[#002147]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
