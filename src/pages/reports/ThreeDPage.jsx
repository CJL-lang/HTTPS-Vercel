/**
 * AI 对话页面 (Ted AI Assistant - Lottie 集成版)
 * 参考：gemini-pulse-ai 架构 + 文档规范
 * 功能：选择 Lottie 角色进行 AI 对话
 * 路由：/three-d
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import DialogBubbles from '../../components/DialogBubbles';
import { Mic } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';

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
    const inputRef = useRef(null);
    
    // 语音输入功能
    const { isListening, startListening, stopListening } = useVoiceInput();

    const handleConfirm = () => {
        setSelectedChar(tempChar);
        setIsSelecting(false);
        setMessages([{ 
            id: 1, 
            sender: 'ai', 
            text: `你好！我是 ${tempChar.name}。${tempChar.description}`, 
            timestamp: Date.now() 
        }]);
    };

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
        const userMessage = { 
            id: messages.length + 1, 
            sender: 'user', 
            text: inputValue, 
            timestamp: Date.now() 
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setTimeout(() => {
            const aiMessage = { 
                id: messages.length + 2, 
                sender: 'ai', 
                text: generateAIResponse(inputValue), 
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        }, 800);
    };

    // 处理语音输入
    const handleVoiceInput = () => {
        if (isListening) {
            // 如果正在录音，停止录音
            stopListening();
        } else {
            // 开始录音
            startListening((text) => {
                // 识别结果回调：将识别到的文字添加到输入框
                if (text && text.trim()) {
                    setInputValue(prev => {
                        // 如果输入框已有内容，追加新内容；否则直接设置
                        return prev ? `${prev} ${text}` : text;
                    });
                    // 自动聚焦到输入框
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            });
        }
    };

    // 对话页面
    if (selectedChar) {
        return (
            <div className="h-[100dvh] bg-transparent flex flex-col relative overflow-hidden text-white">
                {/* 顶部导航 */}
                <header className="h-14 px-4 flex items-center justify-between shrink-0 z-20 border-b border-white/5">
                    <button
                        onClick={() => setSelectedChar(null)}
                        className="p-2 text-slate-300 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className="text-white font-bold text-sm">{selectedChar.name}</h1>
                    </div>
                    <div className="w-6 h-3 rounded-full bg-gradient-to-r from-green-400/60 to-emerald-500/60"></div>
                </header>

                {/* 中间内容区 - 可滚动 */}
                <main className="flex-1 overflow-y-auto px-4 z-10 pt-4 pb-24">
                    {/* 顶部角色展示 */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                        >
                            <div className="w-40 h-40 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 overflow-hidden shadow-2xl">
                                <AnimationPlayer animationKey={selectedChar.animationKey} size="w-40 h-40" />
                            </div>
                            <motion.div
                                className="absolute inset-0 border-2 border-[#d4af37]/20 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>

                    {/* 对话气泡 */}
                    <div className="w-full max-w-2xl mx-auto h-80 bg-transparent">
                        <DialogBubbles messages={messages} className="h-full" />
                    </div>
                </main>

                {/* 底部输入区 */}
                <footer className="fixed bottom-24 left-0 right-0 p-4 z-20">
                    <div className="max-w-2xl mx-auto space-y-3">
                        {/* 语音按钮 */}
                        <button
                            onClick={handleVoiceInput}
                            disabled={!selectedChar}
                            className={cn(
                                "w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95",
                                isListening
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse"
                                    : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black",
                                !selectedChar && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Mic 
                                size={20} 
                                strokeWidth={2.5} 
                                className={isListening ? "animate-pulse" : ""}
                            />
                            {isListening ? "正在录音，点击停止" : "点击说话"}
                        </button>

                        {/* 文本输入 */}
                        <div className="bg-slate-500/20 backdrop-blur-xl rounded-2xl p-1.5 flex items-end gap-2 border border-white/10 focus-within:border-white/20 transition-all shadow-2xl">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    if (inputRef.current) {
                                        inputRef.current.style.height = 'auto';
                                        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="输入消息..."
                                rows={1}
                                disabled={isLoading}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-white placeholder-slate-400/60 resize-none max-h-32 py-2.5 px-3"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                className={cn(
                                    'h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all',
                                    inputValue.trim() && !isLoading
                                        ? 'bg-white text-[#1B3D5E] shadow-lg active:scale-90'
                                        : 'bg-white/5 text-white/20'
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    // 初始选择页面
    return (
        <div className="h-[100dvh] bg-transparent flex flex-col items-center justify-center relative text-white overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <h2 className="text-2xl font-bold mb-4">选择你的对话伙伴</h2>
                <button
                    onClick={() => setIsSelecting(true)}
                    className="px-8 py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                    开始对话
                </button>
            </motion.div>

            <AnimatePresence>
                {isSelecting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start"
                        onClick={() => setIsSelecting(false)}
                    >
                        <motion.div
                            initial={{ y: "-100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "-100%" }}
                            className="w-full bg-slate-500/20 backdrop-blur-xl border-b border-white/10 rounded-b-3xl p-6 pb-8 max-h-[85vh] flex flex-col mt-16 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white text-lg font-bold mb-4">选择对话伙伴</h3>
                            <div className="grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto flex-1">
                                {characters.map(char => (
                                    <motion.button
                                        key={char.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setTempChar(char)}
                                        className={cn(
                                            'p-4 bg-white/5 backdrop-blur-md border rounded-2xl transition-all',
                                            tempChar?.id === char.id ? 'border-[#d4af37] bg-[#d4af37]/15' : 'border-white/10'
                                        )}
                                    >
                                        <div className="w-full h-20 mb-2 rounded-lg bg-white/5 flex items-center justify-center">
                                            <AnimationPlayer animationKey={char.animationKey} size="w-20 h-20" />
                                        </div>
                                        <p className="text-white font-semibold text-xs">{char.name}</p>
                                        <p className="text-slate-400 text-[10px] mt-1">{char.description}</p>
                                    </motion.button>
                                ))}
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={!tempChar}
                                className="w-full mt-8 h-10 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold disabled:opacity-50"
                            >
                                确认
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThreeDPage;
