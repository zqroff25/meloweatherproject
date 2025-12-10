import React, { useRef, useState } from 'react';

interface LandingViewProps {
    onStart: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setMousePos({ x, y });
        }
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full min-h-screen md:h-screen overflow-y-auto md:overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col selection:bg-primary selection:text-white font-inter"
        >
            {/* Dynamic Background Gradients */}
            <div
                className="fixed inset-0 opacity-40 dark:opacity-20 transition-transform duration-75 ease-out will-change-transform pointer-events-none"
                style={{
                    background: `
            radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(19, 182, 236, 0.4) 0%, transparent 50%),
            radial-gradient(circle at ${100 - mousePos.x * 100}% ${100 - mousePos.y * 100}%, rgba(168, 85, 247, 0.4) 0%, transparent 50%)
          `
                }}
            />

            {/* Animated Mesh Grid (Subtle) */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Header (Like Main App) */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200/50 dark:border-slate-700 px-6 sm:px-10 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-sky-500">cloud_circle</span>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        MeloWeather
                    </h2>
                </div>
                {/* Optional: Simple 'Start' button in header for quick action? */}
                <button
                    onClick={onStart}
                    className="md:hidden text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full"
                >
                    Başla
                </button>
            </header>

            {/* Main Content Container */}
            <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-6">

                <div className="max-w-5xl w-full flex flex-col items-center text-center">

                    {/* Hero Title with AI Glow */}
                    <div className="relative mb-8 group animate-fade-in-up delay-100 mt-8 md:mt-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-amber-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                        <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-8 rounded-2xl">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                                Havanın Ritmini <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">Yapay Zeka ile Keşfet</span>
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                                Anlık hava durumuna ve ruh haline göre şekillenen,
                                <span className="font-bold text-slate-800 dark:text-slate-100 mx-1">AI ✦</span>
                                destekli kişiselleştirilmiş müzik deneyimi.
                            </p>
                        </div>
                    </div>

                    {/* Feature Cards (Visuals) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12 animate-fade-in-up delay-200">
                        {[
                            { icon: "thermometer", title: "Hava Durumu", desc: "Bulunduğun yerin atmosferini analiz eder." },
                            { icon: "auto_awesome", title: "Yapay Zeka", desc: "Sana özel benzersiz listeler oluşturur." },
                            { icon: "music_note", title: "Müzik Keyfi", desc: "Apple Music arşiviyle anında dinle." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 hover:scale-105 transition-transform duration-300">
                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-3 mx-auto text-primary">
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{item.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={onStart}
                        className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg shadow-xl shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300 animate-bounce-slow"
                    >
                        <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-sky-400/50 transition-colors"></div>
                        <span className="flex items-center gap-2">
                            Şimdi Başla
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </span>
                    </button>

                    {/* Footer Info (Responsive Positioning) */}
                    <div className="mt-12 md:absolute md:bottom-6 text-xs text-slate-400 font-medium flex gap-4 flex-wrap justify-center">
                        <a href="https://www.zypherdev.com/" target="_blank" rel="noopener noreferrer" className="text-[gray-500] hover:underline ml-1">Powered by ZypherDev</a>
                        <span className="hidden md:inline">•</span>
                        <a href="https://github.com/zqroff25" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">GitHub</a>
                        <span className="hidden md:inline">•</span>
                        <a href="https://www.linkedin.com/in/zakiryildiz/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">LinkedIn</a>
                        <span className="hidden md:inline">•</span>
                        <a href="mailto:yildizzakir0@gmail.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Email</a>
                    </div>

                </div>
            </div>
        </div>
    );
};
