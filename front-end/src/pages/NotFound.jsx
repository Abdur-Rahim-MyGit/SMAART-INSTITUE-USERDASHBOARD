import { Link } from "react-router-dom";
import error404Gif from "@/assets/Error404.gif";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <img 
        src={error404Gif} 
        alt="Page Not Found" 
        className="w-auto h-64 object-contain mb-8"
      />
      
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-[#1a3884] text-white font-semibold rounded-lg shadow-lg hover:bg-[#132c6b] transition-all hover:scale-105"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;


