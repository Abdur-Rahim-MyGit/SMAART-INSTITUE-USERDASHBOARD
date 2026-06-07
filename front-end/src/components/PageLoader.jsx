import React from 'react';

const PageLoader = () => (
    <div className="min-h-screen bg-[#00152E] flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 border-4 border-[#1a3884]/20 rounded-2xl rotate-45" />
            <div className="absolute inset-0 border-4 border-t-[#1a3884] rounded-2xl rotate-45 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[#1a3884] font-bold text-2xl -rotate-45">S</span>
            </div>
        </div>
        <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#1a3884] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-[#1a3884] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-[#1a3884] rounded-full animate-bounce" />
        </div>
    </div>
);

export default PageLoader;
