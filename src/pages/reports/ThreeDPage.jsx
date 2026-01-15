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
import { useVoiceChat } from '../../hooks/useVoiceChat';
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

const confirmFields = [
    { key: 'name', label: '学员姓名', type: 'text', placeholder: '请输入学员姓名' },
    { key: 'age', label: '年龄', type: 'text', placeholder: '请输入年龄' },
    { key: 'gender', label: '性别', type: 'text', placeholder: '男/女' },
    { key: 'email', label: '邮箱', type: 'email', placeholder: '请输入邮箱' },
    { key: 'years_of_golf', label: '球龄', type: 'text', placeholder: '请输入球龄' },
    { key: 'history', label: '高尔夫训练或比赛经历', type: 'textarea', placeholder: '请输入高尔夫训练或比赛经历' },
    { key: 'medical_history', label: '伤病历史', type: 'textarea', placeholder: '请输入伤病历史' },
    { key: 'purpose', label: '训练目标', type: 'textarea', placeholder: '请输入训练目标' },
];

/**
 * 辅助函数：将中文或其他格式的数字强转为 Number
 * 例如： "25岁" -> 25, "三年" -> undefined (简单正则无法处理中文数字，但通常 LLM 会输出阿拉伯数字)
 * @param {*} value
 * @returns {number|undefined}
 */
const normalizeNumber = (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;

    // 尝试提取字符串中的第一个连续数字
    const match = String(value).match(/\d+/);
    if (!match) return undefined;

    return Number(match[0]);
};

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
    const [voiceMode, setVoiceMode] = useState(null); // 'vad' | 'manual' | null
    const shouldAutoSendRef = useRef(false); // 标记是否应该在语音识别完成后自动发送（按键模式）
    const mainRef = useRef(null);
    const submittedRef = useRef(false);
    const reqSeqRef = useRef(0); // 请求序列号，用于丢弃过期响应防止并发乱序

    // VAD 连续语音对话
    const {
        isActive: isVoiceActive,
        isSpeaking: isUserSpeaking,
        isProcessing,
        isTtsPlaying,
        start: startVoiceChat,
        stop: stopVoiceChat,
        speak,
        stopTts,
    } = useVoiceChat({
        onResult: (text) => {
            if (text && text.trim()) {
                // 语音识别完成，自动发送
                handleSendMessage(text);
            }
        },
        onSpeechStart: () => {
            console.log('🎙️ 用户开始说话');
        },
        onSpeechEnd: () => {
            console.log('🛑 用户停止说话');
        },
        onTtsInterrupt: () => {
            console.log('⚡ AI 语音被打断');
        },
        onError: (err) => {
            console.error('❌ 语音错误:', err);
        },
        silenceThreshold: 700,
        energyThreshold: 0.015,
    });

    // 传统按键语音输入
    const { isListening, startListening, stopListening } = useVoiceInput();
    const { isSpeaking: isTtsSpeaking, speak: speakTts, stop: stopTtsSpeaking } = useTextToSpeech();

    // 统一的 TTS 播放函数（根据模式选择）
    const speakMessage = (text, options = { per: '0', spd: '5', vol: '8' }) => {
        if (voiceMode === 'vad') {
            speak(text, options);
        } else {
            speakTts(text, options);
        }
    };

    // 统一的停止 TTS 函数
    const stopSpeakingAll = () => {
        if (voiceMode === 'vad') {
            stopTts();
        } else {
            stopTtsSpeaking();
        }
    };

    // 处理按键语音输入（保留原有逻辑：用户开始说话时停止AI朗读，结束录音后自动发送）
    const handleManualVoiceInput = async () => {
        if (isListening) {
            // 如果正在录音，标记为需要自动发送，然后停止录音
            shouldAutoSendRef.current = true;
            await stopListening();
            // 等待一下，确保最后的识别结果已经通过回调填入输入框
            setTimeout(() => {
                const currentValue = inputRef.current?.value || '';
                if (currentValue.trim()) {
                    handleSendMessage();
                }
                shouldAutoSendRef.current = false;
            }, 600); // 给足够时间让 stopListening 完成并触发回调
        } else {
            // 开始录音前，先停止AI的语音播放（"动漫角色不抢话"功能）
            if (isTtsSpeaking) {
                stopTtsSpeaking();
            }
            // 清空输入框，准备接收语音识别结果
            setInputValue('');
            shouldAutoSendRef.current = false; // 重置自动发送标志
            // 开始录音，识别结果实时填入输入框
            startListening((text) => {
                if (text && text.trim()) {
                    // 实时将识别结果更新到输入框
                    setInputValue(prev => {
                        const newValue = prev ? `${prev} ${text}` : text;
                        return newValue;
                    });
                    // 自动调整输入框高度
                    if (inputRef.current) {
                        setTimeout(() => {
                            inputRef.current.style.height = 'auto';
                            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
                        }, 0);
                    }
                }
            });
        }
    };

    const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmInfo, setConfirmInfo] = useState({});
    const confirmOpenedRef = useRef(false);

    const handleConfirm = () => {
        setSelectedChar(tempChar);
        setIsSelecting(false);

        // 初始化空状态，完全等待 AI 开场
        setCurrentInfo({});
        setNextField(null);
        setIsComplete(false);
        submittedRef.current = false;
        confirmOpenedRef.current = false;
        setIsConfirmOpen(false);
        setConfirmInfo({});

        // 如果选择 VAD 模式，启动连续对话
        if (voiceMode === 'vad') {
            startVoiceChat();
        }

        // 立即触发 AI 开场白
        startAIDialog();
    };

    // NOTE: Removed local/random AI response generator to enforce real /AIDialog usage.

    // 发送用户消息到 /AIDialog 并处理 AI 返回（res.reply, res.is_valid, res.updated_info, res.next_field）
    const handleSendMessage = async (overrideText) => {
        const text = (typeof overrideText === 'string' ? overrideText : inputValue).trim();
        if (!text || !selectedChar || isLoading) return;

        // 生成请求序列号，用于后续丢弃过期响应
        const seq = ++reqSeqRef.current;

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

            // 丢弃过期响应（如果有更新的请求已发出）
            if (seq !== reqSeqRef.current) {
                console.warn('Discarding stale response, seq:', seq, 'current:', reqSeqRef.current);
                return;
            }

            // 1. 基于 is_valid 决定是否更新信息（避免写入错误数据）
            const isValid = res.is_valid !== false; // 默认为 true
            if (isValid) {
                const updatedInfo = res.updated_info && typeof res.updated_info === 'object' ? res.updated_info : {};
                setCurrentInfo(prev => ({ ...(prev || {}), ...updatedInfo })); // 用函数式 setState 防止闭包陷阱
                setNextField(res.next_field || null);
            } else {
                // 若数据无效，不更新 currentInfo 和 nextField，只展示回复让 AI 重新追问
                console.warn('Invalid response from AI, not updating state');
            }

            // 2. 展示 AI 回复
            const aiMessage = res.reply || '...';
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
            });
            speakMessage(aiMessage);

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

    // 启动 AI 对话（用于角色确认后立即发起会话）
    async function startAIDialog() {
        setIsLoading(true);
        // 生成请求序列号
        const seq = ++reqSeqRef.current;
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

            // 丢弃过期响应
            if (seq !== reqSeqRef.current) {
                console.warn('Discarding stale startAIDialog response, seq:', seq, 'current:', reqSeqRef.current);
                return;
            }

            if (!res) {
                // 后端不可用时的静默失败或基础降级
                console.error('Failed to start AI dialog');
                const aiMessage = '你好，我是你的 AI 助手。（连接服务失败）';
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                });
                speakMessage(aiMessage);
            } else {
                // 1. 基于 is_valid 决定是否更新信息
                const isValid = res.is_valid !== false;
                if (isValid) {
                    const updatedInfo = res.updated_info && typeof res.updated_info === 'object' ? res.updated_info : {};
                    setCurrentInfo(prev => ({ ...(prev || {}), ...updatedInfo })); // 用函数式 setState
                    setNextField(res.next_field || null);
                } else {
                    // 若数据无效，不更新 currentInfo / nextField
                    console.warn('Invalid startAIDialog response, not updating state');
                }

                // 2. 展示回复
                const aiMessage = res.reply || '你好';
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                });
                speakMessage(aiMessage);
            }
        } catch (err) {
            console.error('startAIDialog failed', err);
        } finally {
            setIsLoading(false);
        }
    }

    const openConfirmModal = (info) => {
        setConfirmInfo({
            name: info?.name || '',
            age: info?.age || '',
            gender: info?.gender || '',
            email: info?.email || '',
            years_of_golf: info?.years_of_golf || info?.yearsOfGolf || '',
            history: info?.history || info?.golf_history || '',
            medical_history: info?.medical_history || '',
            purpose: info?.purpose || '',
        });
        setIsConfirmOpen(true);
    };

    // 监听完成状态：当 AI 指示 next_field="done" 时，弹出确认框
    useEffect(() => {
        if (nextField === 'done' && !confirmOpenedRef.current) {
            confirmOpenedRef.current = true;
            openConfirmModal(currentInfo);
        }
    }, [nextField]);

    // 自动滚动到底部：当消息更新或开始语音播放时
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({
                top: mainRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTtsPlaying, isTtsSpeaking]);

    // 创建学员并在对话中反馈结果
    async function createStudent(infoOverride = currentInfo) {
        setIsSubmittingStudent(true);
        try {
            // 构造 payload
            const userRaw = (() => {
                try {
                    const saved = localStorage.getItem('user');
                    return saved ? JSON.parse(saved) : null;
                } catch (e) { return null; }
            })();

            const coachId = userRaw?.id || userRaw?.coachId || null;
            const token = userRaw?.token || null;

            const genderRaw = infoOverride.gender;
            const gender = (() => {
                if (genderRaw === undefined || genderRaw === null) return undefined;
                const gs = String(genderRaw).toLowerCase();
                if (gs.includes('男') || gs.includes('male')) return 1;
                if (gs.includes('女') || gs.includes('female')) return 0;
                return undefined;
            })();

            const payload = {
                coach_id: coachId,
                name: infoOverride.name,
                email: infoOverride.email,
                gender: gender,
                age: normalizeNumber(infoOverride.age),
                years_of_golf: normalizeNumber(infoOverride.years_of_golf || infoOverride.yearsOfGolf),
                height: normalizeNumber(infoOverride.height),
                weight: normalizeNumber(infoOverride.weight),
                history: infoOverride.history || infoOverride.golf_history || undefined,
                medical_history: infoOverride.medical_history || undefined,
                purpose: infoOverride.purpose || undefined,
            };

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
                let errorText = '保存学员时遇到问题，请重试或联系管理员。';
                if (result.detail && result.detail.includes('23505')) {
                    errorText = '该邮箱已被注册，请使用其他邮箱。';
                }
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: errorText, timestamp: Date.now() }];
                });
                return;
            }

            // 成功：展示成功提示
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                const successText = `你的档案已建立！(ID: ${result.student_user_id || 'unknown'})`;
                return [...prev, { id: lastId + 1, sender: 'ai', text: successText, timestamp: Date.now() }];
            });
            setIsComplete(true);
            setNextField(null);

        } catch (err) {
            console.error('createStudent error', err);
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                return [...prev, { id: lastId + 1, sender: 'ai', text: '保存学员时出现异常。', timestamp: Date.now() }];
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
                        onClick={() => {
                            // 回退时停止所有语音
                            stopSpeakingAll();
                            if (voiceMode === 'vad') {
                                stopVoiceChat();
                            }
                            setSelectedChar(null);
                        }}
                        className="p-2 text-slate-300 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className="text-white font-bold text-sm">{selectedChar.name}</h1>
                        <span className="text-[10px] text-slate-400">
                            {voiceMode === 'vad' ? '🎤 VAD连续对话' : '🔘 按键语音'}
                        </span>
                    </div>
                    <div className="w-6 h-3 rounded-full bg-gradient-to-r from-green-400/60 to-emerald-500/60"></div>
                </header>

                {/* 信息收集进度与语音状态 */}
                {!isComplete && (
                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 shrink-0">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span>正在收集：</span>
                                <span className="text-[#d4af37]">
                                    {nextField === 'name' && '姓名'}
                                    {nextField === 'age' && '年龄'}
                                    {nextField === 'email' && '邮箱'}
                                    {nextField === 'gender' && '性别'}
                                    {nextField === 'years_of_golf' && '球龄'}
                                    {nextField === 'history' && '高尔夫历史'}
                                    {nextField === 'medical_history' && '伤病历史'}
                                    {nextField === 'purpose' && '训练目的'}
                                    {nextField === 'done' && '✅ 完成'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* VAD 模式状态 */}
                                {voiceMode === 'vad' && isVoiceActive && (
                                    <>
                                        {isUserSpeaking && (
                                            <span className="text-red-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                                说话中
                                            </span>
                                        )}
                                        {isProcessing && (
                                            <span className="text-yellow-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                                                识别中
                                            </span>
                                        )}
                                        {isTtsPlaying && (
                                            <span className="text-blue-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                                播放中
                                            </span>
                                        )}
                                        {!isUserSpeaking && !isProcessing && !isTtsPlaying && (
                                            <span className="text-green-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                等待
                                            </span>
                                        )}
                                    </>
                                )}
                                {/* 按键模式状态 */}
                                {voiceMode === 'manual' && (
                                    <>
                                        {isListening && (
                                            <span className="text-red-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                                录音中
                                            </span>
                                        )}
                                        {isTtsSpeaking && !isListening && (
                                            <span className="text-blue-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                                播放中
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 中间内容区 - 可滚动 */}
                <main ref={mainRef} className="flex-1 overflow-y-auto px-4 z-10 pt-4 pb-56">
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
                <footer className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent pt-6 z-20">
                    <div className="max-w-2xl mx-auto space-y-3">
                        {/* 语音控制区 */}
                        {voiceMode === 'vad' ? (
                            <div className="space-y-2">
                                {/* VAD 状态指示 */}
                                <div className="text-center text-sm text-slate-400">
                                    {isVoiceActive ? (
                                        <>
                                            {isUserSpeaking && '🎤 正在说话...'}
                                            {isProcessing && '⏳ 识别中...'}
                                            {isTtsPlaying && '🔊 AI 回复中...'}
                                            {!isUserSpeaking && !isProcessing && !isTtsPlaying && '👂 等待你说话'}
                                        </>
                                    ) : (
                                        'VAD 连续对话已关闭'
                                    )}
                                </div>

                                {/* VAD 开关按钮 */}
                                <button
                                    onClick={isVoiceActive ? stopVoiceChat : startVoiceChat}
                                    className={cn(
                                        "w-full h-11 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95",
                                        isVoiceActive
                                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                            : "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                    )}
                                >
                                    {isVoiceActive ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                                <rect x="14" y="4" width="4" height="16" rx="1" />
                                            </svg>
                                            关闭连续对话
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={18} strokeWidth={2.5} />
                                            启动连续对话
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            /* 按键语音模式 */
                            <button
                                onClick={handleManualVoiceInput}
                                className={cn(
                                    "w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95",
                                    isListening
                                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse"
                                        : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black"
                                )}
                            >
                                <Mic
                                    size={20}
                                    strokeWidth={2.5}
                                    className={isListening ? "animate-pulse" : ""}
                                />
                                {isListening ? "正在录音，点击停止并发送" : "点击说话"}
                            </button>
                        )}

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
                                placeholder="输入消息或直接说话..."
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

                <AnimatePresence>
                    {isConfirmOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20"
                        >
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[70vh] overflow-y-auto"
                            >
                                <h3 className="text-white text-lg font-bold mb-4">确认学员信息</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {confirmFields.map(field => (
                                        <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                            <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={confirmInfo[field.key] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setConfirmInfo(prev => ({ ...prev, [field.key]: value }));
                                                    }}
                                                    placeholder={field.placeholder}
                                                    rows={3}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={confirmInfo[field.key] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setConfirmInfo(prev => ({ ...prev, [field.key]: value }));
                                                    }}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setCurrentInfo(prev => ({ ...(prev || {}), ...confirmInfo }));
                                            setIsConfirmOpen(false);
                                            createStudent(confirmInfo);
                                        }}
                                        disabled={isSubmittingStudent}
                                        className={cn(
                                            "px-6 h-10 rounded-full font-bold transition-all",
                                            isSubmittingStudent
                                                ? "bg-white/10 text-white/40"
                                                : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black active:scale-95"
                                        )}
                                    >
                                        {isSubmittingStudent ? '提交中...' : '确认信息并提交'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // 初始选择页面
    return (
        <div className="h-[100dvh] bg-transparent flex flex-col items-center justify-center relative text-white overflow-hidden p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md w-full space-y-6"
            >
                <h2 className="text-2xl font-bold mb-6">选择你的对话伙伴</h2>

                {/* 语音模式选择 */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
                    <p className="text-sm text-slate-300 mb-3">选择语音交互模式：</p>

                    <button
                        onClick={() => setVoiceMode('vad')}
                        className={cn(
                            "w-full p-4 rounded-xl border-2 transition-all text-left",
                            voiceMode === 'vad'
                                ? "border-[#d4af37] bg-[#d4af37]/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white mb-1">🎤 VAD 连续对话 (推荐)</h3>
                                <p className="text-xs text-slate-400">
                                    麦克风常开，自动检测语音开始/结束<br />
                                    可随时打断 AI 回复，像微信语音通话
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setVoiceMode('manual')}
                        className={cn(
                            "w-full p-4 rounded-xl border-2 transition-all text-left",
                            voiceMode === 'manual'
                                ? "border-[#d4af37] bg-[#d4af37]/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white mb-1">🔘 按键语音输入</h3>
                                <p className="text-xs text-slate-400">
                                    按下按钮开始录音，再次按下停止<br />
                                    适合安静环境，手动控制
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                <button
                    onClick={() => setIsSelecting(true)}
                    disabled={!voiceMode}
                    className={cn(
                        "w-full px-8 py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold rounded-full shadow-lg transition-all",
                        voiceMode
                            ? "hover:shadow-xl active:scale-95"
                            : "opacity-50 cursor-not-allowed"
                    )}
                >
                    {voiceMode ? '开始对话' : '请先选择语音模式'}
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
