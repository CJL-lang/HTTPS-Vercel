/**
 * useVoiceChat - VAD 驱动的连续对话 Hook
 * 
 * 功能：
 *   1. 麦克风常开，VAD 自动检测语音活动
 *   2. 静音超过阈值（默认 700ms）自动触发识别
 *   3. TTS 播放时检测到用户说话自动打断（barge-in）
 *   4. 完全基于 REST API，不使用 WebSocket
 * 
 * VAD 实现：基于能量阈值的简单 VAD
 *   - 计算每帧音频的 RMS 能量
 *   - 超过阈值认为有声音，低于阈值认为静音
 *   - 连续静音超过指定时间认为一句话结束
 * 
 * 使用方式：
 *   const { isActive, isSpeaking, isProcessing, start, stop } = useVoiceChat({
 *     onResult: (text) => { ... },
 *     onError: (error) => { ... },
 *     silenceThreshold: 700,  // 静音阈值（ms）
 *     energyThreshold: 0.01,  // 能量阈值（0-1）
 *   });
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { getUiLanguage } from '../utils/language';

// ==================== 配置常量 ====================

// 百度语音识别 API 配置
const BAIDU_APP_ID = 121810527;
const BAIDU_API_KEY = 'IkBpJulK2jDfZybH9XlBEFDz';
const BAIDU_SECRET_KEY = 'ksVOfq21zIwRgaHfy2gRCpKJrPgYte7I';

// 百度语音合成 API 配置
const TTS_API_KEY = 'j0xBgZAd65ydvM9zO36SqNmL';
const TTS_SECRET_KEY = 'Q0KztLX8lcIUu6JpzWVEx8MwgnbgW6EL';

// VAD 默认配置
const DEFAULT_CONFIG = {
    silenceThreshold: 700,      // 静音多久认为一句话结束（ms）
    energyThreshold: 0.015,     // RMS 能量阈值（0-1），低于此值认为静音
    minSpeechDuration: 300,     // 最短有效语音时长（ms），防止噪声误触发
    maxSpeechDuration: 30000,   // 最长单次录音时长（ms），防止无限录音
    frameSize: 2048,            // 每帧采样数
    targetSampleRate: 16000,    // 目标采样率
    smoothingFrames: 3,         // 能量平滑帧数，减少抖动
};

// ==================== Token 缓存 ====================

let asrCachedToken = null;
let asrTokenExpireTime = 0;
let ttsCachedToken = null;
let ttsTokenExpireTime = 0;

// 清除 token 缓存（用于调试）
export const clearTokenCache = () => {
    asrCachedToken = null;
    asrTokenExpireTime = 0;
    ttsCachedToken = null;
    ttsTokenExpireTime = 0;
    console.log('🗑️ Token 缓存已清除');
};

// 获取百度 ASR access_token
const getAsrAccessToken = async () => {
    if (asrCachedToken && Date.now() < asrTokenExpireTime) {
        console.log('🔑 使用缓存的 ASR token');
        return asrCachedToken;
    }
    const tokenUrl = `/baidu-token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    console.log('🔑 请求新的 ASR token...', { BAIDU_API_KEY, BAIDU_SECRET_KEY: BAIDU_SECRET_KEY.substring(0, 5) + '...' });
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        console.log('🔑 Token 响应:', data);
        if (data.access_token) {
            asrCachedToken = data.access_token;
            asrTokenExpireTime = Date.now() + (29 * 24 * 60 * 60 * 1000);
            console.log('✅ ASR token 获取成功:', asrCachedToken.substring(0, 20) + '...');
            return asrCachedToken;
        }
        throw new Error(data.error_description || '获取 ASR token 失败');
    } catch (error) {
        console.error('❌ 获取 ASR token 失败:', error);
        throw error;
    }
};

// 获取百度 TTS access_token
const getTtsAccessToken = async () => {
    if (ttsCachedToken && Date.now() < ttsTokenExpireTime) {
        return ttsCachedToken;
    }
    const tokenUrl = `/baidu-token?grant_type=client_credentials&client_id=${TTS_API_KEY}&client_secret=${TTS_SECRET_KEY}`;
    try {
        const response = await fetch(tokenUrl, { method: 'POST' });
        const data = await response.json();
        if (data.access_token) {
            ttsCachedToken = data.access_token;
            ttsTokenExpireTime = Date.now() + (29 * 24 * 60 * 60 * 1000);
            return ttsCachedToken;
        }
        throw new Error(data.error_description || '获取 TTS token 失败');
    } catch (error) {
        console.error('❌ 获取 TTS token 失败:', error);
        throw error;
    }
};

// ==================== 音频处理工具函数 ====================

// Float32Array 转 16-bit PCM
const floatTo16BitPCM = (float32Array) => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
};

// 重采样到目标采样率
const resampleAudio = (inputFloat32, inputSampleRate, targetSampleRate) => {
    if (inputSampleRate === targetSampleRate) return inputFloat32;
    const ratio = inputSampleRate / targetSampleRate;
    const newLength = Math.round(inputFloat32.length / ratio);
    const resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const index = Math.floor(srcIndex);
        const fraction = srcIndex - index;
        if (index + 1 < inputFloat32.length) {
            resampled[i] = inputFloat32[index] * (1 - fraction) + inputFloat32[index + 1] * fraction;
        } else {
            resampled[i] = inputFloat32[index];
        }
    }
    return resampled;
};

// ArrayBuffer 转 base64
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// 计算音频帧的 RMS 能量
const calculateRMS = (samples) => {
    if (!samples || samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
        sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
};

const getRealtimeDevPid = () => (getUiLanguage('zh') === 'en' ? 1737 : 1537);

// ==================== 语音识别 API (WebSocket 实时识别) ====================

const recognizeSpeech = async (pcmData) => {
    const accessToken = await getAsrAccessToken();
    const audioLen = pcmData.buffer.byteLength;

    console.log('🎯 WebSocket 识别，音频字节数:', audioLen);

    return new Promise((resolve, reject) => {
        // 创建 WebSocket 连接
        const wsUrl = `wss://vop.baidu.com/realtime_asr?sn=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        let finalResult = '';
        let partialResults = [];
        let hasError = false;

        // 连接超时处理
        const timeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.CLOSED) {
                ws.close();
                reject(new Error('WebSocket 连接超时'));
            }
        }, 10000);

        ws.onopen = () => {
            console.log('🔌 WebSocket 已连接');
            clearTimeout(timeout);

            // 发送开始帧（注意：使用 sample 而不是 rate）
            const startFrame = JSON.stringify({
                type: 'START',
                data: {
                    appid: BAIDU_APP_ID,
                    appkey: BAIDU_API_KEY,
                    dev_pid: getRealtimeDevPid(),
                    cuid: 'golf_vad_' + Math.random().toString(36).substr(2, 9),
                    format: 'pcm',
                    sample: 16000,  // 注意：这里是 sample 不是 rate
                    channel: 1,
                }
            });
            ws.send(startFrame);
            console.log('📤 发送 START 帧:', startFrame);

            // 发送音频数据帧（分片发送，每片最大 8KB）
            const chunkSize = 8192;
            const buffer = pcmData.buffer;
            let offset = 0;

            const sendChunk = () => {
                if (offset >= buffer.byteLength) {
                    // 发送结束帧
                    const finishFrame = JSON.stringify({ type: 'FINISH' });
                    ws.send(finishFrame);
                    console.log('📤 发送 FINISH 帧');
                    return;
                }

                const chunk = buffer.slice(offset, offset + chunkSize);
                ws.send(chunk);
                offset += chunkSize;

                // 继续发送下一片（间隔 40ms，模拟实时流）
                setTimeout(sendChunk, 40);
            };

            sendChunk();
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📥 收到消息:', message.type, message);

                if (message.type === 'MID_TEXT') {
                    // 中间结果
                    partialResults.push(message.result);
                    console.log('📝 中间结果:', message.result);
                } else if (message.type === 'FIN_TEXT') {
                    // 最终结果
                    finalResult = message.result;
                    console.log('✅ 最终结果:', finalResult);
                } else if (message.type === 'SERVER_ERR') {
                    // 服务器错误
                    hasError = true;
                    const errorMsg = message.message || '服务器错误';
                    console.error('❌ 服务器错误:', errorMsg);
                    reject(new Error(errorMsg));
                }
            } catch (err) {
                console.error('❌ 解析消息失败:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket 错误:', error);
            clearTimeout(timeout);
            if (!hasError) {
                reject(new Error('WebSocket 连接失败'));
            }
        };

        ws.onclose = (event) => {
            console.log('🔌 WebSocket 已关闭，code:', event.code);
            clearTimeout(timeout);

            if (!hasError) {
                // 优先使用最终结果，否则使用最后一个中间结果
                const result = finalResult || (partialResults.length > 0 ? partialResults[partialResults.length - 1] : '');

                if (result && result.trim().length > 0) {
                    resolve(result);
                } else {
                    reject(new Error('未识别到有效语音'));
                }
            }
        };
    });
};

// ==================== 语音合成 API ====================

const synthesizeSpeech = async (text, options = {}) => {
    if (!text || text.length === 0) throw new Error('文本为空');
    if (text.length > 2048) text = text.substring(0, 2048);

    const accessToken = await getTtsAccessToken();
    const params = new URLSearchParams({
        tex: text,
        tok: accessToken,
        cuid: 'golf_vad_' + Math.random().toString(36).substr(2, 9),
        ctp: '1',
        lan: options.lan || 'zh',
        spd: String(options.spd || '5'),
        pit: String(options.pit || '5'),
        vol: String(options.vol || '5'),
        per: String(options.per || '0'),
        aue: String(options.aue || '3')
    });

    const response = await fetch('/baidu-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error(`TTS 请求失败: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(`TTS 错误: ${errorData.err_msg || errorData.err_no}`);
    }

    return await response.blob();
};

// ==================== 主 Hook ====================

export const useVoiceChat = (options = {}) => {
    const config = { ...DEFAULT_CONFIG, ...options };

    // 状态
    const [isActive, setIsActive] = useState(false);           // 是否已启动（麦克风常开）
    const [isSpeaking, setIsSpeaking] = useState(false);       // 用户是否正在说话（VAD 检测）
    const [isProcessing, setIsProcessing] = useState(false);   // 是否正在处理（识别中）
    const [isTtsPlaying, setIsTtsPlaying] = useState(false);   // TTS 是否正在播放
    const [error, setError] = useState(null);                  // 错误信息

    // Refs
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);
    const audioChunksRef = useRef([]);
    const sampleRateRef = useRef(0);

    // VAD 状态
    const vadStateRef = useRef({
        isSpeaking: false,
        silenceStart: null,
        speechStart: null,
        energyHistory: [],
    });

    // TTS 相关
    const ttsAudioRef = useRef(null);
    const ttsUrlRef = useRef(null);

    // 回调 refs
    const onResultRef = useRef(options.onResult);
    const onErrorRef = useRef(options.onError);
    const onSpeechStartRef = useRef(options.onSpeechStart);
    const onSpeechEndRef = useRef(options.onSpeechEnd);
    const onTtsInterruptRef = useRef(options.onTtsInterrupt);

    // 更新回调 refs
    useEffect(() => {
        onResultRef.current = options.onResult;
        onErrorRef.current = options.onError;
        onSpeechStartRef.current = options.onSpeechStart;
        onSpeechEndRef.current = options.onSpeechEnd;
        onTtsInterruptRef.current = options.onTtsInterrupt;
    }, [options.onResult, options.onError, options.onSpeechStart, options.onSpeechEnd, options.onTtsInterrupt]);

    // 停止 TTS 播放
    const stopTts = useCallback(() => {
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.currentTime = 0;
            ttsAudioRef.current = null;
        }
        if (ttsUrlRef.current) {
            URL.revokeObjectURL(ttsUrlRef.current);
            ttsUrlRef.current = null;
        }
        setIsTtsPlaying(false);
    }, []);

    // 处理一句话结束：发送识别请求
    const processUtterance = useCallback(async () => {
        const chunks = audioChunksRef.current;
        const sampleRate = sampleRateRef.current;

        if (chunks.length === 0 || !sampleRate) {
            console.log('⚠️ 无有效音频数据');
            return;
        }

        // 合并所有音频块
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        // 检查时长
        const duration = totalLength / sampleRate * 1000;
        if (duration < config.minSpeechDuration) {
            console.log(`⚠️ 音频太短 (${duration.toFixed(0)}ms < ${config.minSpeechDuration}ms)，忽略`);
            return;
        }

        console.log(`🎤 处理语音片段: ${(duration / 1000).toFixed(2)}秒`);
        setIsProcessing(true);

        try {
            // 重采样到 16kHz
            const resampled = resampleAudio(merged, sampleRate, config.targetSampleRate);
            // 转换为 16-bit PCM
            const pcmData = floatTo16BitPCM(resampled);
            // 识别
            const text = await recognizeSpeech(pcmData);

            if (text && onResultRef.current) {
                onResultRef.current(text);
            }
        } catch (err) {
            console.error('❌ 识别失败:', err);
            setError(err.message);
            if (onErrorRef.current) {
                onErrorRef.current(err);
            }
        } finally {
            setIsProcessing(false);
        }
    }, [config.minSpeechDuration, config.targetSampleRate]);

    // VAD 处理：每帧调用
    const handleAudioFrame = useCallback((samples) => {
        const vad = vadStateRef.current;
        const now = Date.now();

        // 计算 RMS 能量（带平滑）
        const rms = calculateRMS(samples);
        vad.energyHistory.push(rms);
        if (vad.energyHistory.length > config.smoothingFrames) {
            vad.energyHistory.shift();
        }
        const avgEnergy = vad.energyHistory.reduce((a, b) => a + b, 0) / vad.energyHistory.length;

        const isVoice = avgEnergy > config.energyThreshold;

        // 状态机：检测语音开始和结束
        if (isVoice) {
            // 检测到声音
            if (!vad.isSpeaking) {
                // 语音开始
                console.log('🎙️ VAD: 检测到语音开始');
                vad.isSpeaking = true;
                vad.speechStart = now;
                vad.silenceStart = null;
                audioChunksRef.current = []; // 清空之前的数据
                setIsSpeaking(true);

                // Barge-in: 如果 TTS 正在播放，打断它
                if (ttsAudioRef.current) {
                    console.log('⚡ Barge-in: 打断 TTS 播放');
                    stopTts();
                    if (onTtsInterruptRef.current) {
                        onTtsInterruptRef.current();
                    }
                }

                if (onSpeechStartRef.current) {
                    onSpeechStartRef.current();
                }
            }
            vad.silenceStart = null;

            // 收集音频数据
            audioChunksRef.current.push(new Float32Array(samples));

            // 检查最大时长
            if (vad.speechStart && (now - vad.speechStart) > config.maxSpeechDuration) {
                console.log('⚠️ 达到最大录音时长，强制结束');
                vad.isSpeaking = false;
                setIsSpeaking(false);
                processUtterance();
                vad.speechStart = null;
                if (onSpeechEndRef.current) {
                    onSpeechEndRef.current();
                }
            }
        } else {
            // 静音
            if (vad.isSpeaking) {
                // 正在说话中遇到静音
                if (!vad.silenceStart) {
                    vad.silenceStart = now;
                }

                // 继续收集（可能是停顿）
                audioChunksRef.current.push(new Float32Array(samples));

                // 检查静音时长
                const silenceDuration = now - vad.silenceStart;
                if (silenceDuration >= config.silenceThreshold) {
                    // 一句话结束
                    console.log(`🛑 VAD: 静音 ${silenceDuration}ms，一句话结束`);
                    vad.isSpeaking = false;
                    vad.speechStart = null;
                    vad.silenceStart = null;
                    setIsSpeaking(false);

                    if (onSpeechEndRef.current) {
                        onSpeechEndRef.current();
                    }

                    // 触发识别
                    processUtterance();
                }
            }
        }
    }, [config.energyThreshold, config.silenceThreshold, config.smoothingFrames, config.maxSpeechDuration, processUtterance, stopTts]);

    // 启动麦克风和 VAD
    const start = useCallback(async () => {
        if (isActive) {
            console.log('⚠️ 已经在运行中');
            return;
        }

        console.log('🚀 启动 VAD 语音对话...');
        setError(null);

        try {
            // 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            streamRef.current = stream;

            // 创建 AudioContext
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            sampleRateRef.current = audioContext.sampleRate;

            console.log(`🎤 麦克风已启动，采样率: ${audioContext.sampleRate}Hz`);

            // 创建处理节点
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(config.frameSize, 1, 1);

            sourceRef.current = source;
            processorRef.current = processor;

            // 初始化 VAD 状态
            vadStateRef.current = {
                isSpeaking: false,
                silenceStart: null,
                speechStart: null,
                energyHistory: [],
            };
            audioChunksRef.current = [];

            // 处理音频帧
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                handleAudioFrame(inputData);
            };

            // 连接节点
            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsActive(true);
            console.log('✅ VAD 语音对话已启动，等待用户说话...');

        } catch (err) {
            console.error('❌ 启动失败:', err);
            let errorMessage = '启动失败';
            if (err.name === 'NotAllowedError') {
                errorMessage = '麦克风权限被拒绝';
            } else if (err.name === 'NotFoundError') {
                errorMessage = '未找到麦克风设备';
            } else if (err.name === 'NotReadableError') {
                errorMessage = '麦克风被占用';
            }
            setError(errorMessage);
            if (onErrorRef.current) {
                onErrorRef.current(new Error(errorMessage));
            }
        }
    }, [isActive, config.frameSize, handleAudioFrame]);

    // 停止
    const stop = useCallback(() => {
        console.log('🛑 停止 VAD 语音对话');

        // 断开音频节点
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // 关闭 AudioContext
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        // 停止麦克风
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // 停止 TTS
        stopTts();

        // 重置状态
        vadStateRef.current = {
            isSpeaking: false,
            silenceStart: null,
            speechStart: null,
            energyHistory: [],
        };
        audioChunksRef.current = [];
        sampleRateRef.current = 0;

        setIsActive(false);
        setIsSpeaking(false);
        setIsProcessing(false);
        setError(null);

        console.log('✅ 已停止');
    }, [stopTts]);

    // 播放 TTS
    const speak = useCallback(async (text, options = {}) => {
        if (!text || text.trim().length === 0) {
            console.warn('⚠️ TTS 文本为空');
            return;
        }

        // 停止之前的播放
        stopTts();

        try {
            console.log('🔊 合成语音:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            setIsTtsPlaying(true);

            const audioBlob = await synthesizeSpeech(text, options);
            const audioUrl = URL.createObjectURL(audioBlob);
            ttsUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            ttsAudioRef.current = audio;

            audio.onended = () => {
                console.log('✅ TTS 播放完成');
                setIsTtsPlaying(false);
                ttsAudioRef.current = null;
                if (ttsUrlRef.current) {
                    URL.revokeObjectURL(ttsUrlRef.current);
                    ttsUrlRef.current = null;
                }
            };

            audio.onerror = (err) => {
                console.error('❌ TTS 播放失败:', err);
                setIsTtsPlaying(false);
                ttsAudioRef.current = null;
            };

            await audio.play();
            console.log('🎵 TTS 播放中...');

        } catch (err) {
            console.error('❌ TTS 合成失败:', err);
            setIsTtsPlaying(false);
            if (onErrorRef.current) {
                onErrorRef.current(err);
            }
        }
    }, [stopTts]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (isActive) {
                stop();
            }
        };
    }, [isActive, stop]);

    return {
        // 状态
        isActive,           // 是否已启动（麦克风常开）
        isSpeaking,         // 用户是否正在说话
        isProcessing,       // 是否正在识别
        isTtsPlaying,       // TTS 是否正在播放
        error,              // 错误信息

        // 方法
        start,              // 启动麦克风和 VAD
        stop,               // 停止一切
        speak,              // 播放 TTS（会被 barge-in 打断）
        stopTts,            // 手动停止 TTS
    };
};

// ==================== 兼容旧接口的 Wrapper ====================

/**
 * useVoiceInput - 兼容旧接口的 wrapper
 * 保持原有的 startListening / stopListening 接口，但内部使用 VAD
 */
export const useVoiceInput = () => {
    const callbackRef = useRef(null);

    const {
        isActive,
        isSpeaking,
        isProcessing,
        error,
        start,
        stop,
    } = useVoiceChat({
        onResult: (text) => {
            if (callbackRef.current) {
                callbackRef.current(text);
            }
        },
        onError: (err) => {
            console.error('语音输入错误:', err);
        }
    });

    const startListening = useCallback(async (onResult) => {
        callbackRef.current = onResult;
        await start();
    }, [start]);

    const stopListening = useCallback(() => {
        callbackRef.current = null;
        stop();
    }, [stop]);

    return {
        isListening: isActive || isSpeaking || isProcessing,
        hasSupport: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
        startListening,
        stopListening,
        error,
    };
};

export default useVoiceChat;
