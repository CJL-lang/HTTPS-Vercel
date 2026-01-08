/**
 * AI 对话页面
 * 功能：选择3D卡通人物角色进行AI对话
 * 路由：/three-d
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import PageWrapper from '../../components/PageWrapper';
import { X, Check, Send, RotateCcw, Mic } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

// Lottie 动画数据
const animationsPaths = {
    bunny: '/animations/Bunny.json',
    robot: '/animations/Robot_Futuristic_Ai_animated.json',
    tiger: '/animations/Cute_Tiger.json',
    cat: '/animations/Lovely_Cat.json',
    powerRobot: '/animations/Little_power_robot.json',
    pigeon: '/animations/Just_a_pigeon..json',
    chatbot: '/animations/chatbot.json',
};

// 卡通人物数据（关联 Lottie 动画）
const characters = [
    { id: 1, name: '智慧小兔', animationKey: 'bunny', description: '聪慧机灵的助手' },
    { id: 2, name: '未来机器人', animationKey: 'robot', description: '科技感十足的伙伴' },
    { id: 3, name: '活力老虎', animationKey: 'tiger', description: '充满能量的精灵' },
    { id: 4, name: '温柔猫咪', animationKey: 'cat', description: '温暖贴心的陪伴' },
    { id: 5, name: '小小机甲', animationKey: 'powerRobot', description: '强大的机械助手' },
    { id: 6, name: '自在飞鸽', animationKey: 'pigeon', description: '自由飞翔的朋友' },
    { id: 7, name: '智能聊天机器人', animationKey: 'chatbot', description: '贴心的AI助手' },
];

// 加载动画数据的 hook
const useLottieAnimation = (path) => {
    const [animationData, setAnimationData] = useState(null);
    useEffect(() => {
        if (!path) return;
        fetch(path)
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Failed to load animation:', err));
    }, [path]);
    return animationData;
};

// Lottie 动画组件
const AnimationPlayer = ({ animationKey, size = 'w-16 h-16' }) => {
    const path = animationsPaths[animationKey];
    const animationData = useLottieAnimation(path);
    if (!animationData) {
        return <div className={cn(size, "rounded-full bg-white/5")}></div>;
    }
    return (
        <Lottie animationData={animationData} loop={true} autoPlay={true} style={{ width: '100%', height: '100%' }} />
    );
};

const ThreeDPage = () => {
    const { t } = useLanguage();
    const [selectedChar, setSelectedChar] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [tempChar, setTempChar] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const handleConfirm = () => {
        setSelectedChar(tempChar);
        setIsSelecting(false);
        setMessages([{ id: 1, sender: 'ai', text: `你好！我是 ${tempChar.name}。${tempChar.description}`, timestamp: new Date() }]);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const generateAIResponse = (userMessage) => {
        const responses = [
            `我理解。${userMessage}`,
            `这个问题很有意思。我的看法是：${userMessage}`,
            `你说得好，让我帮你分析一下${userMessage}`,
            `很感谢你的提问。关于这个，${userMessage}`,
            `我想从另一个角度来看待这个问题。${userMessage}`,
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !selectedChar) return;
        const userMessage = { id: messages.length + 1, sender: 'user', text: inputValue, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setTimeout(() => {
            const aiMessage = { id: messages.length + 2, sender: 'ai', text: generateAIResponse(inputValue), timestamp: new Date() };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        }, 800);
    };

    const handleChangeCharacter = () => {
        setTempChar(selectedChar);
        setIsSelecting(true);
    };

    const handleResetChat = () => {
        setMessages([{ id: 1, sender: 'ai', text: `你好！我是 ${selectedChar.name}。${selectedChar.description}`, timestamp: new Date() }]);
        setInputValue('');
    };

    // 对话页面
    if (selectedChar) {
        return (
            <PageWrapper title={t('threeDTitle')}>
                <div className="flex flex-col h-screen max-h-[calc(100vh-80px)] relative bg-transparent overflow-hidden">
                    {/* 上半部分：大动画显示 + 对话气泡 */}
                    <div className="flex-1 flex flex-col items-center justify-start relative overflow-hidden pt-8">
                        {/* 背景光晕 */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[100px] animate-pulse"></div>
                        </div>
                        
                        {/* 大动画容器 */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 flex-shrink-0"
                        >
                            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-white/5 flex items-center justify-center border-4 border-white/10 overflow-hidden shadow-2xl">
                                <AnimationPlayer animationKey={selectedChar.animationKey} size="w-72 h-72 sm:w-80 sm:h-80" />
                                <motion.div 
                                    className="absolute inset-0 border-4 border-[#d4af37]/20 rounded-full" 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }} 
                                />
                            </div>
                        </motion.div>

                        {/* 对话气泡面板：与动画分离，独立滚动 */}
                        <div className="absolute inset-x-4 top-4 bottom-44 z-20 max-w-md mx-auto pointer-events-auto">
                            <div className="h-full overflow-y-auto pr-2 scrollbar-hide space-y-3">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "flex",
                                            msg.sender === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[80%] px-5 py-3 rounded-3xl text-base sm:text-lg leading-relaxed shadow-lg backdrop-blur-sm",
                                            msg.sender === 'user' 
                                                ? "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-medium" 
                                                : "bg-white/10 border border-white/20 text-white"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 固定在导航栏上方的输入区域 */}
                <div className="fixed bottom-24 left-0 right-0 z-20 px-4 sm:px-6">
                    <div className="max-w-md mx-auto space-y-3">
                        {/* 语音按钮 */}
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg sm:text-xl shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                        >
                            <Mic size={26} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                            <span>语音输入</span>
                        </motion.button>

                        {/* 文字输入框 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full h-[54px] rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg flex items-center gap-3 px-5"
                        >
                            <input 
                                type="text" 
                                value={inputValue} 
                                onChange={(e) => setInputValue(e.target.value)} 
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                                placeholder="输入消息..." 
                                className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-base sm:text-lg"
                            />
                            
                            <button 
                                onClick={handleSendMessage} 
                                disabled={!inputValue.trim() || isLoading} 
                                className={cn(
                                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    inputValue.trim() && !isLoading
                                        ? "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black hover:scale-110 active:scale-95 shadow-lg"
                                        : "bg-white/5 text-white/30 cursor-not-allowed"
                                )}
                            >
                                <Send size={20} />
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Modal */}
                <AnimatePresence>
                    {isSelecting && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 bg-black/85" onClick={() => setIsSelecting(false)}>
                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">选择角色</h3>
                                            <p className="text-[11px] text-[#d4af37] font-bold uppercase tracking-widest mt-1">选择你想聊天的AI助手</p>
                                        </div>
                                        <button onClick={() => setIsSelecting(false)} className="w-12 h-12 rounded-2xl surface-weak flex items-center justify-center text-white/60 hover:surface hover:text-white transition-all border border-white/5 active:scale-90">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-5 max-h-[45vh] overflow-y-auto pr-3 scrollbar-hide">
                                        {characters.map((char) => (
                                            <button key={char.id} onClick={() => setTempChar(char)} className={cn("flex flex-col items-center gap-4 p-5 rounded-[32px] border transition-all duration-500 relative group/item", tempChar?.id === char.id ? "bg-[#d4af37]/15 border-[#d4af37] scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]" : "surface-weak border-white/5 hover:border-white/20 hover:surface")}>
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center shadow-xl relative overflow-hidden transition-transform duration-500 group-hover/item:scale-110 border-2 border-white/10">
                                                    <AnimationPlayer animationKey={char.animationKey} size="w-16 h-16" />
                                                </div>
                                                <span className={cn("text-[11px] font-bold uppercase tracking-widest text-center leading-tight transition-colors", tempChar?.id === char.id ? "text-[#d4af37]" : "text-white/40")}>
                                                    {char.name}
                                                </span>
                                                <span className="text-[9px] text-white/40 text-center leading-tight">{char.description}</span>
                                                {tempChar?.id === char.id && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#d4af37] flex items-center justify-center text-black border-2 border-[#1a1a1a]">
                                                        <Check size={14} strokeWidth={4} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-10 pt-8 border-t border-white/5">
                                        <button onClick={handleConfirm} disabled={!tempChar} className={cn("w-full py-5 rounded-[32px] flex items-center justify-center gap-4 font-bold uppercase tracking-[0.3em] transition-all duration-500", tempChar ? "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-[0_15px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95" : "surface-weak text-white/10 cursor-not-allowed")}>
                                            <span className="text-lg">确认选择</span>
                                            <Check size={24} strokeWidth={4} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </PageWrapper>
        );
    }

    // 初始页面
    return (
        <PageWrapper title={t('threeDTitle')}>
            <div className="flex flex-col items-center justify-between min-h-[70vh] py-10 relative">
                <div className="relative flex-1 flex items-center justify-center w-full">
                    <div className="absolute w-80 h-80 bg-[#d4af37]/15 rounded-full blur-[100px] animate-pulse"></div>
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={() => { setTempChar(null); setIsSelecting(true); }} className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-white/20 surface-weak flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#d4af37]/50 transition-all duration-500 group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 relative z-20">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 border-4 border-black/20">
                                <span className="text-3xl sm:text-4xl font-bold text-black">AI</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-bold uppercase tracking-[0.3em] text-xs sm:text-sm mb-1">选择你的AI助手</h3>
                                <p className="text-[#d4af37]/60 text-[11px] sm:text-[12px] uppercase font-bold tracking-widest">点击开始对话</p>
                            </div>
                        </motion.div>
                        <motion.div className="absolute inset-0 border-2 border-[#d4af37]/20 rounded-full z-10" animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} />
                        <motion.div className="absolute inset-4 border border-white/10 rounded-full z-10" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    </motion.div>
                    <motion.div className="abbsolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent z-20 pointer-events-none shadow-[0_0_15px_#d4af37]" animate={{ top: ['30%', '70%'] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                </div>
                <div className="w-full space-y-10 px-8 mt-12">
                    <div className="bg-gradient-to-r from-white/5 to-white/0 border border-white/10 rounded-2xl p-8">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-4">✨ AI 对话助手</h3>
                        <p className="text-white/70 text-xs leading-relaxed">
                            选择你喜欢的卡通角色，与我们的AI助手开始智能对话。每个角色都有独特的个性和风格，为你提供个性化的聊天体验。
                        </p>
                    </div>
                </div>

                <AnimatePresence>
                    {isSelecting && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 bg-black/85" onClick={() => setIsSelecting(false)}>
                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">选择角色</h3>
                                            <p className="text-[11px] text-[#d4af37] font-bold uppercase tracking-widest mt-1">选择你想聊天的AI助手</p>
                                        </div>
                                        <button onClick={() => setIsSelecting(false)} className="w-12 h-12 rounded-2xl surface-weak flex items-center justify-center text-white/60 hover:surface hover:text-white transition-all border border-white/5 active:scale-90">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-5 max-h-[45vh] overflow-y-auto pr-3 scrollbar-hide">
                                        {characters.map((char) => (
                                            <button key={char.id} onClick={() => setTempChar(char)} className={cn("flex flex-col items-center gap-4 p-5 rounded-[32px] border transition-all duration-500 relative group/item", tempChar?.id === char.id ? "bg-[#d4af37]/15 border-[#d4af37] scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]" : "surface-weak border-white/5 hover:border-white/20 hover:surface")}>
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center shadow-xl relative overflow-hidden transition-transform duration-500 group-hover/item:scale-110 border-2 border-white/10">
                                                    <AnimationPlayer animationKey={char.animationKey} size="w-16 h-16" />
                                                </div>
                                                <span className={cn("text-[11px] font-bold uppercase tracking-widest text-center leading-tight transition-colors", tempChar?.id === char.id ? "text-[#d4af37]" : "text-white/40")}>
                                                    {char.name}
                                                </span>
                                                <span className="text-[9px] text-white/40 text-center leading-tight">{char.description}</span>
                                                {tempChar?.id === char.id && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#d4af37] flex items-center justify-center text-black border-2 border-[#1a1a1a]">
                                                        <Check size={14} strokeWidth={4} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-10 pt-8 border-t border-white/5">
                                        <button onClick={handleConfirm} disabled={!tempChar} className={cn("w-full py-5 rounded-[32px] flex items-center justify-center gap-4 font-bold uppercase tracking-[0.3em] transition-all duration-500", tempChar ? "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-[0_15px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95" : "surface-weak text-white/10 cursor-not-allowed")}>
                                            <span className="text-lg">开始对话</span>
                                            <Check size={24} strokeWidth={4} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageWrapper>
    );
};

export default ThreeDPage;
