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
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

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
    const [currentInfo, setCurrentInfo] = useState({});
    const [nextField, setNextField] = useState('name');
    const [isComplete, setIsComplete] = useState(false);

    // 语音输入功能
    const { isListening, startListening, stopListening } = useVoiceInput();

    // 文字转语音功能
    const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

    // AI 对话采集相关状态
    const FIELD_LABELS = {
        name: '姓名',
        email: '邮箱',
        gender: '性别',
        age: '年龄',
        years_of_golf: '球龄',
        height: '身高(cm)',
        weight: '体重(kg)',
        golf_history: '高尔夫历史',
        medical_history: '伤病历史',
        purpose: '个人训练目的',
    };

    // 前端必填字段白名单（优先检查顺序）
    const REQUIRED_FIELDS = ['name', 'email'];

    const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

    // 简单邮箱校验
    const isValidEmail = (email) => {
        if (!email) return false;
        try {
            const e = String(email).trim();
            // 简单正则：存在 @ 且格式合理
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
        } catch (e) {
            return false;
        }
    };

    const handleConfirm = () => {
        setSelectedChar(tempChar);
        setIsSelecting(false);
        // 保持现有角色开场，然后输出固定欢迎语并初始化表单式对话流程
        const intro = `你好！我是 ${tempChar.name}。${tempChar.description}`;
        const welcome = `欢迎来到 AI 学员信息注册助手 😊\n我会一步一步了解你的情况，帮助我们更好地制定训练方案。\n我们先开始吧：请输入你的姓名`;

        setMessages([
            { id: 1, sender: 'ai', text: intro, timestamp: Date.now() },
            { id: 2, sender: 'ai', text: welcome, timestamp: Date.now() + 1 }
        ]);

        // 初始化表单数据与流程控制，后续每次用户输入都会调用 /AIDialog
        setCurrentInfo({});
        setNextField('name');
    };

    // NOTE: Removed local/random AI response generator to enforce real /AIDialog usage.

    // 发送用户消息到 /AIDialog 并处理 AI 返回（res.reply, res.is_valid, res.updated_info, res.next_field）
    const handleSendMessage = async (overrideText) => {
        const text = (typeof overrideText === 'string' ? overrideText : inputValue).trim();
        if (!text || !selectedChar) return;

        // Append user message (use functional updater to avoid stale state)
        setMessages(prev => {
            const lastId = prev.length ? prev[prev.length - 1].id : 0;
            return [...prev, { id: lastId + 1, sender: 'user', text, timestamp: Date.now() }];
        });
        setInputValue('');
        setIsLoading(true);

        try {
            const payload = { current_info: currentInfo, last_user_message: text };
            // build headers (include auth if available)
            const savedUser = (() => {
                try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch (e) { return null; }
            })();
            const token = savedUser?.token || null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const resp = await fetch(`/api/AIDialog`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                throw new Error(`AIDialog HTTP ${resp.status}`);
            }

            const res = await resp.json();

            // Merge updated_info into currentInfo (single source of truth)
            const updatedInfo = res.updated_info && typeof res.updated_info === 'object' ? res.updated_info : {};
            const mergedInfo = { ...(currentInfo || {}), ...updatedInfo };
            setCurrentInfo(mergedInfo);

            // Decide nextField and whether to display the AI reply.
            const returnedNext = res.next_field || null;

            // Helper to find next missing field (prefer REQUIRED_FIELDS then others)
            const getNextMissing = () => {
                for (const f of REQUIRED_FIELDS) {
                    if (!mergedInfo[f] || String(mergedInfo[f]).trim() === '') return f;
                }
                for (const f of Object.keys(FIELD_LABELS)) {
                    if (!mergedInfo[f] || String(mergedInfo[f]).trim() === '') return f;
                }
                return null;
            };

            // If backend indicates 'done', ensure email exists/valid before completing
            if (returnedNext === 'done') {
                if (!isValidEmail(mergedInfo?.email)) {
                    // Ask for email explicitly, do not complete
                    const aiMessage = '我还需要你的邮箱地址，用于接收训练资料。请告诉我你的邮箱。';
                    setMessages(prev => {
                        const lastId = prev.length ? prev[prev.length - 1].id : 0;
                        return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                    });
                    speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                    setNextField('email');
                } else {
                    // All good, append AI reply and mark done
                    const aiMessage = res.reply || '已完成信息收集。';
                    setMessages(prev => {
                        const lastId = prev.length ? prev[prev.length - 1].id : 0;
                        return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                    });
                    speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                    setNextField('done');
                    console.log('学员信息采集完成', mergedInfo);
                }
                return;
            }

            // If backend asks for a field we already have, do NOT repeat the question.
            if (returnedNext && mergedInfo[returnedNext] !== undefined && mergedInfo[returnedNext] !== null && String(mergedInfo[returnedNext]).trim() !== '') {
                // find the next truly missing field
                const missing = getNextMissing();
                if (missing) {
                    const aiMessage = `已记录你的${FIELD_LABELS[returnedNext] || returnedNext}，接下来请提供${FIELD_LABELS[missing] || missing}。`;
                    setMessages(prev => {
                        const lastId = prev.length ? prev[prev.length - 1].id : 0;
                        return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                    });
                    speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                    setNextField(missing);
                } else {
                    // nothing missing -> treat as done (email already validated earlier in flow will block if necessary)
                    if (!isValidEmail(mergedInfo?.email)) {
                        const aiMessage = '我还需要你的邮箱地址，用于接收训练资料。请告诉我你的邮箱。';
                        setMessages(prev => {
                            const lastId = prev.length ? prev[prev.length - 1].id : 0;
                            return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                        });
                        speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                        setNextField('email');
                    } else {
                        const aiMessage = res.reply || '已完成信息收集。';
                        setMessages(prev => {
                            const lastId = prev.length ? prev[prev.length - 1].id : 0;
                            return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                        });
                        speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                        setNextField('done');
                    }
                }
                return;
            }

            // Default: append AI reply and set nextField as returned
            const aiMessage = res.reply || '...';
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
            });
            speak(aiMessage, { per: '0', spd: '5', vol: '8' });
            setNextField(returnedNext);
        } catch (err) {
            console.error('AIDialog request failed', err);
            // Basic fallback UI feedback
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                return [...prev, { id: lastId + 1, sender: 'ai', text: '网络或服务暂不可用，请稍后再试。', timestamp: Date.now() }];
            });
            // Minimal user-facing alert
            try { alert('网络或服务暂不可用，请稍后再试。'); } catch (e) { /* ignore in non-browser env */ }
        } finally {
            setIsLoading(false);
        }
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

    // 启动 AI 对话（用于角色确认后立即发起会话）
    async function startAIDialog() {
        setIsLoading(true);
        try {
            // build headers like other API calls
            const savedUser = (() => {
                try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch (e) { return null; }
            })();
            const token = savedUser?.token || null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/AIDialog`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ current_info: {}, last_user_message: 'start' })
            }).then(r => r.json()).catch(() => null);

            if (!res) {
                // 后端不可用的回退提示
                const aiMessage = `你好！我是 ${tempChar?.name}。${tempChar?.description}`;
                setMessages(prev => [...prev, { sender: 'ai', text: aiMessage, timestamp: Date.now() }]);
                // 自动朗读 AI 回复
                speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                setCurrentInfo({});
                setNextField(null);
            } else {
                // Merge updated_info into currentInfo
                const updatedInfo = res.updated_info && typeof res.updated_info === 'object' ? res.updated_info : {};
                const mergedInfo = { ...(currentInfo || {}), ...updatedInfo };
                setCurrentInfo(mergedInfo);

                // Determine next missing field
                const findNextMissing = () => {
                    for (const f of REQUIRED_FIELDS) {
                        if (!mergedInfo[f] || String(mergedInfo[f]).trim() === '') return f;
                    }
                    for (const f of Object.keys(FIELD_LABELS)) {
                        if (!mergedInfo[f] || String(mergedInfo[f]).trim() === '') return f;
                    }
                    return null;
                };

                if (res.next_field === 'done') {
                    if (!isValidEmail(mergedInfo?.email)) {
                        const aiMessage = '我还需要你的邮箱地址，用于接收训练资料。请告诉我你的邮箱。';
                        setMessages(prev => [...prev, { sender: 'ai', text: aiMessage, timestamp: Date.now() }]);
                        speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                        setNextField('email');
                    } else {
                        setMessages(prev => [...prev, { sender: 'ai', text: res.reply, timestamp: Date.now() }]);
                        speak(res.reply, { per: '0', spd: '5', vol: '8' });
                        setNextField('done');
                    }
                } else if (res.next_field && mergedInfo[res.next_field] !== undefined && mergedInfo[res.next_field] !== null && String(mergedInfo[res.next_field]).trim() !== '') {
                    const missing = findNextMissing();
                    if (missing) {
                        const aiMessage = `已记录。接下来请提供${FIELD_LABELS[missing] || missing}。`;
                        setMessages(prev => [...prev, { sender: 'ai', text: aiMessage, timestamp: Date.now() }]);
                        speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                        setNextField(missing);
                    } else {
                        if (!isValidEmail(mergedInfo?.email)) {
                            const aiMessage = '我还需要你的邮箱地址，用于接收训练资料。请告诉我你的邮箱。';
                            setMessages(prev => [...prev, { sender: 'ai', text: aiMessage, timestamp: Date.now() }]);
                            speak(aiMessage, { per: '0', spd: '5', vol: '8' });
                            setNextField('email');
                        } else {
                            setMessages(prev => [...prev, { sender: 'ai', text: res.reply, timestamp: Date.now() }]);
                            speak(res.reply, { per: '0', spd: '5', vol: '8' });
                            setNextField('done');
                        }
                    }
                } else {
                    setMessages(prev => [...prev, { sender: 'ai', text: res.reply, timestamp: Date.now() }]);
                    speak(res.reply, { per: '0', spd: '5', vol: '8' });
                    setNextField(res.next_field || null);
                }
            }
        } catch (err) {
            console.error('startAIDialog failed', err);
        } finally {
            setIsLoading(false);
        }
    }

    // 监听完成状态
    useEffect(() => {
        if (nextField === 'done') {
            // 学员信息采集完成 -> 在创建前兜底校验 email
            const emailToCheck = currentInfo?.email;
            if (!isValidEmail(emailToCheck)) {
                // 不调用 /students，改由 AI 继续询问邮箱
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: '请提供你的邮箱地址，我们需要发送训练资料和通知。', timestamp: Date.now() }];
                });
                setNextField('email');
                return;
            }

            // 通过校验后再真正提交
            if (!isSubmittingStudent) {
                createStudent();
            }
        }
    }, [nextField, currentInfo]);

    // 创建学员并在对话中反馈结果（真实调用 POST /students，携带 Authorization）
    async function createStudent() {
        setIsSubmittingStudent(true);
        try {
            // 构造 payload，兼容 currentInfo 中不同命名（golf_history / history）
            const userRaw = (() => {
                try {
                    const saved = localStorage.getItem('user');
                    return saved ? JSON.parse(saved) : null;
                } catch (e) { return null; }
            })();

            const coachId = userRaw?.id || userRaw?.coachId || null;
            const token = userRaw?.token || null;

            const genderRaw = currentInfo.gender;
            const gender = (() => {
                if (genderRaw === undefined || genderRaw === null) return undefined;
                const gs = String(genderRaw).toLowerCase();
                if (gs.includes('男') || gs.includes('male')) return 1;
                if (gs.includes('女') || gs.includes('female')) return 0;
                return undefined;
            })();

            const payload = {
                coach_id: coachId,
                name: currentInfo.name,
                email: currentInfo.email,
                gender: gender,
                age: currentInfo.age ? Number(currentInfo.age) : undefined,
                years_of_golf: currentInfo.years_of_golf || currentInfo.yearsOfGolf || undefined,
                height: currentInfo.height ? Number(currentInfo.height) : undefined,
                weight: currentInfo.weight ? Number(currentInfo.weight) : undefined,
                history: currentInfo.history || currentInfo.golf_history || undefined,
                medical_history: currentInfo.medical_history || undefined,
                purpose: currentInfo.purpose || undefined,
            };

            // 最后兜底校验：绝不在缺少或非法 email 时调用后端创建接口
            if (!isValidEmail(payload.email)) {
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: '我还需要你的邮箱地址才能为你创建学员档案，请输入你的邮箱。', timestamp: Date.now() }];
                });
                setNextField('email');
                return;
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/students', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                console.error('Create student failed', res.status, result);
                // 不直接向用户展示 HTTP 错误或“创建失败”字样，改为温和提示并记录日志
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: '保存学员时遇到问题，我会稍后再试。如需立即重试，请在对话中输入“重试”。', timestamp: Date.now() }];
                });
                return;
            }

            // 成功：展示成功提示，并处理 student_user_id
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                const successText = `太好了！你的学员信息已经成功创建 🎉\n接下来我们可以开始评估与训练计划了 ⛳`;
                return [...prev, { id: lastId + 1, sender: 'ai', text: successText, timestamp: Date.now() }];
            });

            if (result.student_user_id) {
                console.log('新学员 ID:', result.student_user_id);
            }
        } catch (err) {
            console.error('createStudent error', err);
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                return [...prev, { id: lastId + 1, sender: 'ai', text: '保存学员时出现异常，我会稍后重试。', timestamp: Date.now() }];
            });
        } finally {
            setIsSubmittingStudent(false);
        }
    }

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
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className="text-white font-bold text-sm">{selectedChar.name}</h1>
                    </div>
                    <div className="w-6 h-3 rounded-full bg-gradient-to-r from-green-400/60 to-emerald-500/60"></div>
                </header>

                {/* 信息收集进度 */}
                {!isComplete && (
                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>正在收集信息：</span>
                            <span className="text-[#d4af37]">
                                {nextField === 'name' && '姓名'}
                                {nextField === 'age' && '年龄'}
                                {nextField === 'gender' && '性别'}
                                {nextField === 'years_of_golf' && '球龄'}
                                {nextField === 'history' && '高尔夫历史'}
                                {nextField === 'medical_history' && '伤病历史'}
                                {nextField === 'purpose' && '训练目的'}
                            </span>
                        </div>
                    </div>
                )}

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
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
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
