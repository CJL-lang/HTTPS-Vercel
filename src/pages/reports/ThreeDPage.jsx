/**
 * AI 对话页面 (Ted AI Assistant - Lottie 集成版)
 * 参考：gemini-pulse-ai 架构 + 文档规范
 * 功能：选择 Lottie 角色进行 AI 对话
 * 路由：/three-d
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import DialogBubbles from '../../components/DialogBubbles';
import { Mic } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

// Lottie 动画数据
const animationsPaths = {
    bunny: '/animations_lottie/Bunny.lottie',
    mage: '/animations_lottie/Interactive%20Mage%20animation.lottie',
    tiger: '/animations_lottie/Cute%20Tiger.lottie',
    pigeon: '/animations_lottie/Just%20a%20pigeon..lottie',
    bloomingo: '/animations_lottie/Bloomingo.lottie',
    giraffe: '/animations_lottie/Meditating%20Giraffe.lottie',
    balloonRabbit: '/animations_lottie/Nice%20rabbit%20with%20balloon.lottie',
    partyDance: '/animations_lottie/Party%20Dance.lottie',
};

const STUDENT_AVATAR_MAP_KEY = 'studentAvatarMap';

const saveStudentAvatar = (studentId, animationKey) => {
    if (!studentId || !animationKey) return;
    try {
        const raw = localStorage.getItem(STUDENT_AVATAR_MAP_KEY);
        const map = raw ? JSON.parse(raw) : {};
        map[String(studentId)] = animationKey;
        localStorage.setItem(STUDENT_AVATAR_MAP_KEY, JSON.stringify(map));
    } catch (err) {
        console.warn('Failed to save student avatar mapping:', err);
    }
};

// 字段关键词映射 - 用于检测 AI 提问与进度显示是否一致
const fieldKeywords = {
    name: ['姓名', '名字', '叫什么', '称呼'],
    age: ['年龄', '多大', '几岁', '岁数'],
    gender: ['性别', '男', '女', '先生', '女士'],
    email: ['邮箱', '邮件', 'email', '联系方式', '联系'],
    years_of_golf: ['球龄', '打球', '高尔夫', '接触', '学球'],
    history: ['经历', '打过', '训练', '比赛', '学过', '练过'],
    medical_history: ['伤病', '受伤', '病史', '身体', '健康'],
    purpose: ['目标', '希望', '想提升', '想改善', '想提高', '目的是'],
};

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

// Lottie 动画组件
const AnimationPlayer = ({ animationKey, size = 'w-16 h-16' }) => {
    const path = animationsPaths[animationKey];
    if (!path) {
        return <div className={cn(size, "bg-white/5")}></div>;
    }
    return (
        <DotLottieReact src={path} loop autoplay style={{ width: '100%', height: '100%' }} />
    );
};

const ThreeDPage = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    // 卡通人物数据（关联 Lottie 动画）
    const characters = useMemo(() => [
        { id: 1, name: t('smartBunny'), animationKey: 'bunny', description: t('smartBunnyDesc') },
        { id: 2, name: t('interactiveMage'), animationKey: 'mage', description: t('interactiveMageDesc') },
        { id: 3, name: t('energeticTiger'), animationKey: 'tiger', description: t('energeticTigerDesc') },
        { id: 4, name: t('freePigeon'), animationKey: 'pigeon', description: t('freePigeonDesc') },
        { id: 5, name: t('bloomingo'), animationKey: 'bloomingo', description: t('bloomingoDesc') },
        { id: 6, name: t('meditatingGiraffe'), animationKey: 'giraffe', description: t('meditatingGiraffeDesc') },
        { id: 7, name: t('balloonRabbit'), animationKey: 'balloonRabbit', description: t('balloonRabbitDesc') },
        { id: 8, name: t('partyDance'), animationKey: 'partyDance', description: t('partyDanceDesc') },
    ], [t]);

    const confirmFields = useMemo(() => [
        { key: 'name', label: t('studentNameLabel'), type: 'text', placeholder: t('studentNamePlaceholder') },
        { key: 'age', label: t('age'), type: 'text', placeholder: t('agePlaceholder') },
        { key: 'gender', label: t('gender'), type: 'text', placeholder: t('genderPlaceholder') },
        { key: 'email', label: t('emailLabel'), type: 'email', placeholder: t('emailPlaceholder') },
        { key: 'years_of_golf', label: t('yearsOfGolf'), type: 'text', placeholder: t('golfYearsPlaceholder') },
        { key: 'history', label: t('golfHistory'), type: 'textarea', placeholder: t('golfHistoryPlaceholder') },
        { key: 'medical_history', label: t('injuryHistory'), type: 'textarea', placeholder: t('medicalHistoryPlaceholder') },
        { key: 'purpose', label: t('personalTrainingGoals'), type: 'textarea', placeholder: t('trainingGoalPlaceholder') },
    ], [t]);

    const fieldDisplayNames = useMemo(() => ({
        name: t('statusName'),
        age: t('statusAge'),
        gender: t('statusGender'),
        email: t('statusEmail'),
        years_of_golf: t('statusGolfYears'),
        history: t('statusGolfHistory'),
        medical_history: t('statusInjuryHistory'),
        purpose: t('statusTrainingGoal'),
    }), [t]);

    /**
     * 检测 AI 提问内容与 nextField 是否匹配
     * @param {string} aiMessage - AI 的回复内容
     * @param {string} nextField - 后端返回的下一个字段
     * @returns {object} { isMatch: boolean, detectedField: string|null, warning: string|null }
     */
    const detectFieldMismatch = (aiMessage, nextField) => {
        if (!aiMessage || !nextField || nextField === 'done') {
            return { isMatch: true, detectedField: null, warning: null };
        }

        // 检查 AI 消息中是否包含 nextField 的关键词
        const nextFieldKeywords = fieldKeywords[nextField] || [];
        const hasNextFieldKeywords = nextFieldKeywords.some(keyword =>
            aiMessage.includes(keyword)
        );

        if (hasNextFieldKeywords) {
            return { isMatch: true, detectedField: nextField, warning: null };
        }

        // 尝试检测 AI 实际在问什么字段
        for (const [field, keywords] of Object.entries(fieldKeywords)) {
            if (field === nextField) continue; // 跳过已检查的字段

            const hasKeyword = keywords.some(keyword => aiMessage.includes(keyword));
            if (hasKeyword) {
                return {
                    isMatch: false,
                    detectedField: field,
                    warning: `⚠️ 检测到不一致：AI 询问"${fieldDisplayNames[field]}"，但进度显示为"${fieldDisplayNames[nextField]}"`
                };
            }
        }

        // 无法明确检测到任何字段，返回匹配
        return { isMatch: true, detectedField: null, warning: null };
    };

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
            // 停止录音，保留文本在输入框中供用户编辑和发送
            await stopListening();
        } else {
            // 开始录音前，先停止AI的语音播放（"动漫角色不抢话"功能）
            if (isTtsSpeaking) {
                stopTtsSpeaking();
            }
            // 准备接收语音识别结果
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
    const [confirmError, setConfirmError] = useState('');
    const [errorFields, setErrorFields] = useState([]); // 存储出错的字段名
    const confirmOpenedRef = useRef(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationStudentId, setCelebrationStudentId] = useState(null);
    const [celebrationStudentData, setCelebrationStudentData] = useState(null);
    const celebrationNavRef = useRef(false);

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
        setConfirmError('');
        setErrorFields([]);

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
            // 获取 AI 刚刚问过的话
            const lastAiMessage = [...messages].reverse().find(msg => msg.sender === 'ai');
            const lastAiPrompt = lastAiMessage ? lastAiMessage.text : '';

            const payload = {
                current_info: currentInfo,
                last_user_message: text,
                last_ai_prompt: lastAiPrompt,
                language: language === 'en' ? 'en' : 'cn'
            };
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
            const newNextField = res.next_field || null;

            if (isValid) {
                const updatedInfo = res.updated_info && typeof res.updated_info === 'object' ? res.updated_info : {};
                setCurrentInfo(prev => ({ ...(prev || {}), ...updatedInfo })); // 用函数式 setState 防止闭包陷阱
                setNextField(newNextField);
            } else {
                // 若数据无效，不更新 currentInfo 和 nextField，只展示回复让 AI 重新追问
                console.warn('Invalid response from AI, not updating state');
            }

            // 2. 展示 AI 回复
            const aiMessage = res.reply || '...';

            // 3. 检测 AI 提问与 nextField 是否一致
            if (isValid && newNextField) {
                const mismatch = detectFieldMismatch(aiMessage, newNextField);
                if (!mismatch.isMatch && mismatch.warning) {
                    console.warn(mismatch.warning);
                    // 在控制台输出警告，方便调试
                    console.log(`AI Message: "${aiMessage}"`);
                    console.log(`Expected Field: ${newNextField}, Detected: ${mismatch.detectedField}`);
                }
            }

            // 前端拦截：当数据收集完成时，不显示 AI 消息也不播放语音
            if (newNextField !== 'done') {
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                });
                speakMessage(aiMessage);
            } else {
                console.log('数据收集完成，跳过 AI 消息显示，直接准备打开确认窗口');
            }

        } catch (err) {
            console.error('AIDialog request failed', err);
            const errorMsg = t('networkOrServiceUnavailable');

            // Add error message to chat
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                return [...prev, { id: lastId + 1, sender: 'ai', text: errorMsg, timestamp: Date.now() }];
            });

            // If collection appears complete, offer confirmation modal with error
            const collectedFields = Object.keys(currentInfo).length;
            if (collectedFields >= 3) { // Arbitrary threshold - adjust as needed
                setTimeout(() => {
                    openConfirmModal(currentInfo);
                    setConfirmError(t('aiDialogError'));
                }, 1000);
            }

            try { alert(errorMsg); } catch (e) { /* ignore in non-browser env */ }
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
            // Frontend-generated greetings logic (Replacing backend call)
            const isEn = language === 'en';

            const greetingsOptions = [
                {
                    cn: "你好！很高兴遇见你。我是你的专属AI高尔夫助手。为了为你量身定制训练计划，我首先需要认识你。请问怎么称呼你呢？",
                    en: "Hello! It's a pleasure to meet you. I am your dedicated AI golf assistant. To tailor a training plan for you, I'd like to get to know you first. May I have your name?"
                },
                {
                    cn: "嗨！我是这里的智能教练助手。如果不介意的话，我们可以先聊聊你的基本情况，这样我能更好地帮助你。我们先从名字开始吧，你叫什么名字？",
                    en: "Hi! I am your intelligent coaching assistant. If you don't mind, let's chat about your background so I can help you better. Let's start with your name. What should I call you?"
                },
                {
                    cn: "哈喽！小球手。很高兴能和你一起开启高尔夫进阶之旅。在这之前，能告诉我你的名字吗？让我们互相认识一下！",
                    en: "Hello! Ball player. I'm excited to start this golf improvement journey with you. Before we begin, could you tell me your name? Let's get introduced!"
                }
            ];

            const randomIndex = Math.floor(Math.random() * greetingsOptions.length);
            const selectedGreeting = isEn ? greetingsOptions[randomIndex].en : greetingsOptions[randomIndex].cn;

            // Simulate backend response structure
            const res = {
                is_valid: true,
                next_field: 'name',
                reply: selectedGreeting,
                updated_info: {}
            };

            // 模拟一点网络延迟，让体验更自然
            await new Promise(resolve => setTimeout(resolve, 600));

            // 丢弃过期响应
            if (seq !== reqSeqRef.current) {
                console.warn('Discarding stale startAIDialog response, seq:', seq, 'current:', reqSeqRef.current);
                return;
            }

            if (!res) {
                // Fallback (redundant now but kept for safety structure)
                console.error('Failed to start AI dialog');
                const aiMessage = t('helloIAmAssistant');
                setMessages(prev => {
                    const lastId = prev.length ? prev[prev.length - 1].id : 0;
                    return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                });
                speakMessage(aiMessage);
            } else {
                // 1. 基于 is_valid 决定是否更新信息
                const isValid = res.is_valid !== false;
                const newNextField = res.next_field || null;

                if (isValid) {
                    const updatedInfo = res.updated_info && typeof res.updated_info === 'object' ? res.updated_info : {};
                    setCurrentInfo(prev => ({ ...(prev || {}), ...updatedInfo })); // 用函数式 setState
                    setNextField(newNextField);
                }

                // 2. 展示回复
                const aiMessage = res.reply || t('hello');

                // 3. 检测 AI 提问与 nextField 是否一致
                if (isValid && newNextField) {
                    const mismatch = detectFieldMismatch(aiMessage, newNextField);
                    if (!mismatch.isMatch && mismatch.warning) {
                        console.warn(mismatch.warning);
                        console.log(`AI Message: "${aiMessage}"`);
                        console.log(`Expected Field: ${newNextField}, Detected: ${mismatch.detectedField}`);
                    }
                }

                // 前端拦截：当数据收集完成时，不显示 AI 消息也不播放语音
                if (newNextField !== 'done') {
                    setMessages(prev => {
                        const lastId = prev.length ? prev[prev.length - 1].id : 0;
                        return [...prev, { id: lastId + 1, sender: 'ai', text: aiMessage, timestamp: Date.now() }];
                    });
                    speakMessage(aiMessage);
                } else {
                    console.log('startAIDialog: 数据收集完成，跳过 AI 消息显示');
                }
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
            years_of_golf: info?.golf_of_year ?? info?.years_of_golf ?? info?.yearsOfGolf ?? '',
            history: info?.history || info?.golf_history || '',
            medical_history: info?.medical_history || '',
            purpose: info?.purpose || '',
        });
        setIsConfirmOpen(true);
    };

    const handleConfirmSubmit = () => {
        // Clear previous errors
        setConfirmError('');
        setErrorFields([]);

        // Update currentInfo with confirmed data
        setCurrentInfo(prev => ({ ...(prev || {}), ...confirmInfo }));

        // Don't close modal here - let createStudent handle it on success
        createStudent(confirmInfo);
    };

    const handleCancelConfirm = () => {
        setIsConfirmOpen(false);
        setConfirmError('');
        setErrorFields([]);
        // Reset flag to allow reopening modal if needed
        confirmOpenedRef.current = false;
    };

    const resetConversation = () => {
        // 清除所有对话数据
        setCurrentInfo({});
        setMessages([]);
        setNextField(null);
        setIsComplete(false);
        submittedRef.current = false;
        confirmOpenedRef.current = false;
        setIsConfirmOpen(false);
        setConfirmInfo({});
        setConfirmError('');
        setErrorFields([]);
        setInputValue('');
        setIsLoading(false);
        setShowCelebration(false);
        setCelebrationStudentId(null);
        setCelebrationStudentData(null);
        celebrationNavRef.current = false;
    };

    // 监听完成状态：当 AI 指示 next_field="done" 时，弹出确认框
    useEffect(() => {
        if (nextField === 'done' && !confirmOpenedRef.current) {
            confirmOpenedRef.current = true;
            openConfirmModal(currentInfo);
        }
    }, [nextField]);

    useEffect(() => {
        if (!showCelebration || !celebrationStudentId) return;
        const timer = setTimeout(() => {
            if (celebrationNavRef.current) return;
            celebrationNavRef.current = true;
            navigate(`/student/${celebrationStudentId}`, {
                state: { student: celebrationStudentData },
            });
        }, 3000);
        return () => clearTimeout(timer);
    }, [showCelebration, celebrationStudentId, celebrationStudentData, navigate]);

    const handleCelebrationComplete = () => {
        if (celebrationNavRef.current || !celebrationStudentId) return;
        celebrationNavRef.current = true;
        navigate(`/student/${celebrationStudentId}`, {
            state: { student: celebrationStudentData },
        });
    };

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
                const gs = String(genderRaw).toLowerCase().trim();
                if (gs.includes('女')) return 0;
                if (gs.includes('男')) return 1;
                if (gs === 'female') return 0;
                if (gs === 'male') return 1;
                return undefined;
            })();

            const backendLang = language === 'en' ? 'en' : 'cn';
            const payload = {
                coach_id: coachId,
                name: infoOverride.name,
                email: infoOverride.email,
                gender: gender,
                age: normalizeNumber(infoOverride.age),
                years_of_golf: normalizeNumber(infoOverride.golf_of_year ?? infoOverride.years_of_golf ?? infoOverride.yearsOfGolf),
                height: normalizeNumber(infoOverride.height),
                weight: normalizeNumber(infoOverride.weight),
                history: infoOverride.history || infoOverride.golf_history || undefined,
                medical_history: infoOverride.medical_history || undefined,
                purpose: infoOverride.purpose || undefined,
                language: backendLang,
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
                console.log('Error result detail:', result.detail);
                console.log('Error result message:', result.message);
                console.log('Error result error_fields:', result.error_fields);

                let errorText = t('errorSavingStudent');
                let fields = []; // 默认没有特定字段错误

                // 如果后端直接返回了 message，优先使用
                if (result.message) {
                    errorText = `⚠️ ${result.message}`;
                    console.log('Using backend message:', errorText);
                }

                // 根据不同的错误类型识别字段
                if (result.detail) {
                    if (result.detail.includes('23505')) {
                        // 唯一约束 violation - 通常是邮箱
                        errorText = t('emailAlreadyRegistered');
                        fields = ['email'];
                    } else if (result.detail.includes('email')) {
                        errorText = t('emailFormatIncorrect');
                        fields = ['email'];
                    } else if (result.detail.includes('name')) {
                        errorText = t('nameCannotBeEmpty');
                        fields = ['name'];
                    } else if (result.detail.includes('age') || result.detail.includes('年龄')) {
                        errorText = t('ageFormatIncorrect');
                        fields = ['age'];
                    } else if (result.detail.includes('gender') || result.detail.includes('性别')) {
                        errorText = t('genderFormatIncorrect');
                        fields = ['gender'];
                    }
                }

                // 如果有详细的字段错误信息
                if (result.error_fields && Array.isArray(result.error_fields)) {
                    fields = result.error_fields;

                    // 生成更友好的多字段错误提示
                    const fieldLabels = {
                        email: '邮箱',
                        name: '姓名',
                        age: '年龄',
                        gender: '性别',
                        years_of_golf: '球龄',
                        history: '高尔夫经历',
                        medical_history: '伤病历史',
                        purpose: '训练目标'
                    };

                    const errorFieldNames = fields.map(f => fieldLabels[f] || f).join('、');
                    errorText = result.message || `⚠️ 以下字段填写有误：${errorFieldNames}`;
                }

                // Show error in modal - modal stays open for retry
                console.log('Setting error text:', errorText);
                console.log('Setting error fields:', fields);
                setConfirmError(errorText);
                setErrorFields(fields);
                return;
            }

            const createdStudentId = result.student_user_id || result.id || result.student_id;
            if (createdStudentId && selectedChar?.animationKey) {
                saveStudentAvatar(createdStudentId, selectedChar.animationKey);
            }

            // 成功：展示成功提示
            setMessages(prev => {
                const lastId = prev.length ? prev[prev.length - 1].id : 0;
                const successText = t('yourProfileCreated').replace('{id}', result.student_user_id || 'unknown');
                return [...prev, { id: lastId + 1, sender: 'ai', text: successText, timestamp: Date.now() }];
            });

            // Close modal only on success
            setIsConfirmOpen(false);

            setIsComplete(true);
            setNextField(null);

            if (createdStudentId) {
                setCelebrationStudentId(createdStudentId);
                setCelebrationStudentData({
                    id: createdStudentId,
                    name: payload.name,
                    email: payload.email,
                    gender: payload.gender,
                    age: payload.age,
                    years_of_golf: payload.years_of_golf,
                    history: payload.history,
                    purpose: payload.purpose,
                });
                setShowCelebration(true);
            }

        } catch (err) {
            console.error('createStudent error', err);
            // Show error in modal - modal stays open for retry
            setConfirmError(t('savingStudentException'));
        } finally {
            setIsSubmittingStudent(false);
        }
    }

    // 对话页面
    if (selectedChar) {
        return (
            <div className="h-[100dvh] bg-transparent flex flex-col relative overflow-hidden text-white">
                {showCelebration && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
                        <DotLottieReact
                            src="/congratulation.lottie"
                            autoplay
                            loop={false}
                            style={{ width: '100%', height: '100%' }}
                            onComplete={handleCelebrationComplete}
                        />
                    </div>
                )}
                {/* 顶部导航 */}
                <header className="h-14 px-4 flex items-center justify-between shrink-0 z-30 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <button
                        onClick={() => {
                            // 回退时停止所有语音
                            stopSpeakingAll();
                            if (voiceMode === 'vad') {
                                stopVoiceChat();
                            }
                            // 清除所有对话状态
                            resetConversation();
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

                {/* 固定渐变模糊层 - 用于在上半部分产生模糊效果 */}
                <div
                    className="fixed top-14 left-0 right-0 z-[25] pointer-events-none"
                    style={{
                        height: '50vh',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)'
                    }}
                ></div>

                {/* 顶部固定的角色展示（固定定位，始终可见，位于模糊层之上） */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed top-14 left-0 right-0 h-[50vh] max-h-[50vh] z-[26] overflow-hidden pointer-events-none"
                >
                    <div className="w-full h-full">
                        <AnimationPlayer animationKey={selectedChar?.animationKey} size="w-full h-full" />
                    </div>
                </motion.div>

                {/* 信息收集进度与语音状态 */}
                {!isComplete && (
                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 shrink-0">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span>{t('collectingInfo')}</span>
                                <span className="text-[#d4af37]">
                                    {nextField === 'name' && t('statusName')}
                                    {nextField === 'age' && t('statusAge')}
                                    {nextField === 'email' && t('statusEmail')}
                                    {nextField === 'gender' && t('statusGender')}
                                    {nextField === 'years_of_golf' && t('statusGolfYears')}
                                    {nextField === 'history' && t('statusGolfHistory')}
                                    {nextField === 'medical_history' && t('statusInjuryHistory')}
                                    {nextField === 'purpose' && t('statusTrainingGoal')}
                                    {nextField === 'done' && t('statusCompleted')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* VAD 模式状态 */}
                                {voiceMode === 'vad' && isVoiceActive && (
                                    <>
                                        {isUserSpeaking && (
                                            <span className="text-red-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                                {t('speaking')}
                                            </span>
                                        )}
                                        {isProcessing && (
                                            <span className="text-yellow-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                                                {t('recognizing')}
                                            </span>
                                        )}
                                        {isTtsPlaying && (
                                            <span className="text-blue-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                                {t('playing')}
                                            </span>
                                        )}
                                        {!isUserSpeaking && !isProcessing && !isTtsPlaying && (
                                            <span className="text-green-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                {t('waiting')}
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
                                                {t('recording')}
                                            </span>
                                        )}
                                        {isTtsSpeaking && !isListening && (
                                            <span className="text-blue-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                                {t('playing')}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 中间内容区 - 可滚动 */}
                <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto px-4 z-20 pb-56" style={{ paddingTop: 'calc(50vh + 56px)' }}>
                    {/* 对话气泡 */}
                    <div className="w-full max-w-2xl mx-auto flex-1 bg-transparent">
                        <DialogBubbles messages={messages} className="flex-1" />
                    </div>
                </main>

                {/* 底部输入区 */}
                <footer className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent pt-6 z-20">
                    <div className="max-w-2xl mx-auto space-y-3">
                        {/* 当数据收集完成时，显示打开确认窗口按钮 */}
                        {nextField === 'done' && !isConfirmOpen && !isComplete && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => openConfirmModal(currentInfo)}
                                className="w-full h-12 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                                打开确认窗口
                            </motion.button>
                        )}

                        {/* 语音控制区 */}
                        {voiceMode === 'vad' ? (
                            <div className="space-y-2">
                                {/* VAD 状态指示 */}
                                <div className="text-center text-sm text-slate-400">
                                    {isVoiceActive ? (
                                        <>
                                            {isUserSpeaking && t('currentlySpeaking')}
                                            {isProcessing && t('currentlyRecognizing')}
                                            {isTtsPlaying && t('aiReplying')}
                                            {!isUserSpeaking && !isProcessing && !isTtsPlaying && t('waitingForYou')}
                                        </>
                                    ) : (
                                        t('vadContinuousClosed')
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
                                            {t('closeContinuousChat')}
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={18} strokeWidth={2.5} />
                                            {t('startContinuousChat')}
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
                                {isListening ? t('recordingClickToSend') : t('clickToSpeak')}
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
                                placeholder={t('inputMessageOrSpeak')}
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
                                <h3 className="text-white text-lg font-bold mb-4">{t('confirmStudentInfo')}</h3>

                                {/* Error message display */}
                                {confirmError && (
                                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                                        <p className="text-red-400 text-sm font-medium">{confirmError}</p>
                                        {errorFields.length > 0 && (
                                            <p className="text-red-300/70 text-xs mt-1">
                                                {t('modifyRedFields')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {confirmFields.map(field => {
                                        const hasError = errorFields.includes(field.key);
                                        return (
                                            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                <label className={cn(
                                                    "block text-xs mb-1",
                                                    hasError ? "text-red-400" : "text-slate-400"
                                                )}>
                                                    {field.label}
                                                    {hasError && <span className="ml-1 text-red-400">⚠️</span>}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        value={confirmInfo[field.key] || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setConfirmInfo(prev => ({ ...prev, [field.key]: value }));
                                                            // 清除该字段的错误状态
                                                            if (hasError) {
                                                                setErrorFields(prev => prev.filter(f => f !== field.key));
                                                            }
                                                        }}
                                                        placeholder={field.placeholder}
                                                        rows={3}
                                                        className={cn(
                                                            "w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-all",
                                                            hasError
                                                                ? "bg-red-500/10 border-2 border-red-500/50 focus:border-red-500"
                                                                : "bg-white/5 border border-white/10 focus:border-white/30"
                                                        )}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={confirmInfo[field.key] || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setConfirmInfo(prev => ({ ...prev, [field.key]: value }));
                                                            // 清除该字段的错误状态
                                                            if (hasError) {
                                                                setErrorFields(prev => prev.filter(f => f !== field.key));
                                                            }
                                                        }}
                                                        placeholder={field.placeholder}
                                                        className={cn(
                                                            "w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-all",
                                                            hasError
                                                                ? "bg-red-500/10 border-2 border-red-500/50 focus:border-red-500"
                                                                : "bg-white/5 border border-white/10 focus:border-white/30"
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 flex items-center justify-end gap-3">
                                    {/* Cancel button - return to AI chat */}
                                    <button
                                        onClick={handleCancelConfirm}
                                        className="px-6 h-10 rounded-full font-bold bg-white/10 text-white hover:bg-white/15 transition-all"
                                    >
                                        {t('returnToChat')}
                                    </button>

                                    {/* Submit button */}
                                    <button
                                        onClick={handleConfirmSubmit}
                                        disabled={isSubmittingStudent}
                                        className={cn(
                                            "px-6 h-10 rounded-full font-bold transition-all",
                                            isSubmittingStudent
                                                ? "bg-white/10 text-white/40"
                                                : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black active:scale-95"
                                        )}
                                    >
                                        {isSubmittingStudent ? t('submitting') : t('confirmAndSubmit')}
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
                <h2 className="text-2xl font-bold mb-6">{t('selectChatPartner')}</h2>

                {/* 语音模式选择 */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
                    <p className="text-sm text-slate-300 mb-3">{t('selectVoiceMode')}</p>

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
                                <h3 className="font-bold text-white mb-1">{t('vadContinuousChat')}</h3>
                                <p className="text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: t('vadContinuousChatDesc') }}></p>
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
                                <h3 className="font-bold text-white mb-1">{t('manualVoiceInput')}</h3>
                                <p className="text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: t('manualVoiceInputDesc') }}></p>
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
                    {voiceMode ? t('startChat') : t('pleaseSelectVoiceMode')}
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
                            <h3 className="text-white text-lg font-bold mb-4">{t('selectDialogPartner')}</h3>
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
                                {t('confirm')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThreeDPage;
