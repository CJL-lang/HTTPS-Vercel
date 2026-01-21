import { useState, useRef, useCallback } from 'react';
import { getUiLanguage } from '../utils/language';

// 百度语音识别 API 配置
const BAIDU_APP_ID = 121810527;
const BAIDU_API_KEY = 'IkBpJulK2jDfZybH9XlBEFDz';
const BAIDU_SECRET_KEY = 'ksVOfq21zIwRgaHfy2gRCpKJrPgYte7I';

// 百度实时识别 WebSocket 地址（直连百度服务器）
const BAIDU_WS_URL = 'wss://vop.baidu.com/realtime_asr';

// 缓存 access_token
let cachedToken = null;
let tokenExpireTime = 0;

// 获取百度 access_token（带缓存）
const getBaiduAccessToken = async () => {
    // 如果 token 还有效，直接返回
    if (cachedToken && Date.now() < tokenExpireTime) {
        return cachedToken;
    }

    const tokenUrl = `/baidu-token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (data.access_token) {
            cachedToken = data.access_token;
            // token 有效期 30 天，我们设置 29 天后过期
            tokenExpireTime = Date.now() + (29 * 24 * 60 * 60 * 1000);
            return cachedToken;
        }
        throw new Error(data.error_description || '获取 token 失败');
    } catch (error) {
        console.error('获取百度 access_token 失败:', error);
        throw error;
    }
};

// 将 Float32Array 转换为 16-bit PCM
const floatTo16BitPCM = (float32Array) => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
};

// 将任意采样率的 Float32 数据重采样到 16k（线性插值）
const resampleTo16k = (inputFloat32, inputSampleRate) => {
    if (!inputSampleRate || inputSampleRate === 16000) return inputFloat32;

    const ratio = inputSampleRate / 16000;
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

// 将 ArrayBuffer 转换为 base64
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const getRealtimeDevPid = () => (getUiLanguage('zh') === 'en' ? 1737 : 1537);

// 调用百度语音识别 REST API（一次性提交）
const recognizeSpeech = async (pcmData, accessToken, devPid) => {
    const base64Audio = arrayBufferToBase64(pcmData.buffer);
    const audioLen = pcmData.buffer.byteLength;

    console.log('=== 百度语音识别调试信息 ===');
    console.log('PCM 数据字节数:', audioLen);
    console.log('Base64 长度:', base64Audio.length);

    const requestBody = {
        format: 'pcm',
        rate: 16000,
        channel: 1,
        cuid: 'golf_frontend_' + Math.random().toString(36).substr(2, 9),
        token: accessToken,
        speech: base64Audio,
        len: audioLen,
        dev_pid: devPid  // 1537=普通话(支持简单的英文识别), 1737=英语, 1637=粤语
    };

    try {
        const response = await fetch('/baidu-asr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('=== 百度 API 完整返回 ===');
        console.log(JSON.stringify(data, null, 2));

        if (data.err_no === 0 && data.result && data.result.length > 0) {
            console.log('✅ 识别成功:', data.result[0]);
            return data.result[0];
        } else {
            console.error('❌ 识别失败，错误码:', data.err_no, '错误信息:', data.err_msg);
            const errorMessages = {
                3300: '输入参数不正确',
                3301: '音频质量过差',
                3302: '鉴权失败',
                3303: '语音服务器后端问题',
                3304: '用户的请求QPS超限',
                3305: '用户的日pv超限',
                3307: '语音服务器后端识别出错问题',
                3308: '音频过长',
                3309: '音频数据问题',
                3310: '输入的音频文件过大',
                3311: '采样率rate参数不在选项里',
                3312: '音频格式format参数不在选项里'
            };
            throw new Error(errorMessages[data.err_no] || `识别失败 (${data.err_no}): ${data.err_msg || '未知错误'}`);
        }
    } catch (error) {
        console.error('百度语音识别失败:', error);
        throw error;
    }
};

export const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false);
    const [hasSupport, setHasSupport] = useState(true);
    const streamRef = useRef(null);
    const wsRef = useRef(null);
    const onResultCallbackRef = useRef(null);
    const timeoutRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);
    const audioChunksRef = useRef([]);
    const actualSampleRateRef = useRef(0);
    const lastProcessedIndexRef = useRef(0);
    const accumulatedTextRef = useRef(''); // 累积所有最终识别结果
    const currentSegmentTextRef = useRef(''); // 当前片段的中间结果

    // 检查浏览器是否支持必要的 API
    useState(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasSupport(false);
        }
    });

    // 处理当前累积的音频数据（一次性提交 REST）
    const processCurrentSegment = useCallback(async () => {
        const totalChunks = audioChunksRef.current.length;
        const audioChunks = audioChunksRef.current;
        const actualSampleRate = actualSampleRateRef.current;

        if (totalChunks === 0 || !actualSampleRate) {
            return;
        }

        // 合并所有音频数据
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const mergedAudio = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
            mergedAudio.set(chunk, offset);
            offset += chunk.length;
        }

        const duration = totalLength / actualSampleRate;
        if (duration < 0.5) {
            return;
        }

        console.log(`🎯 最终识别: ${duration.toFixed(2)}秒音频`);

        try {
            const targetSampleRate = 16000;
            const ratio = actualSampleRate / targetSampleRate;
            const newLength = Math.round(totalLength / ratio);
            const resampled = new Float32Array(newLength);

            for (let i = 0; i < newLength; i++) {
                const srcIndex = i * ratio;
                const index = Math.floor(srcIndex);
                const fraction = srcIndex - index;

                if (index + 1 < mergedAudio.length) {
                    resampled[i] = mergedAudio[index] * (1 - fraction) + mergedAudio[index + 1] * fraction;
                } else {
                    resampled[i] = mergedAudio[index];
                }
            }

            const pcmData = floatTo16BitPCM(resampled);
            const accessToken = await getBaiduAccessToken();
            const devPid = getRealtimeDevPid();
            const result = await recognizeSpeech(pcmData, accessToken, devPid);

            if (result && onResultCallbackRef.current) {
                onResultCallbackRef.current(result);
            }

            lastProcessedIndexRef.current = totalChunks;
        } catch (error) {
            console.error('最终识别失败:', error);
        }
    }, []);

    // 处理录音数据的函数（最终处理，REST 或 WS 已经流式发送）
    const processRecording = useCallback(async () => {
        if (!audioChunksRef.current.length) {
            console.log('无录音数据');
            return;
        }

        // 如果是 WebSocket 模式，停止时会发送 FINISH，这里无需再 REST。
        if (wsRef.current) {
            try {
                wsRef.current.send(JSON.stringify({ type: 'FINISH' }));
            } catch (e) {
                console.warn('发送 FINISH 失败:', e);
            }
            return;
        }

        // REST 模式：停止时一次性识别
        await processCurrentSegment();
    }, [processCurrentSegment]);

    // 开始录音
    const startListening = useCallback(async (onResult) => {
        if (isListening) return;

        onResultCallbackRef.current = onResult;
        audioChunksRef.current = [];
        lastProcessedIndexRef.current = 0;
        accumulatedTextRef.current = ''; // 重置累积文本
        currentSegmentTextRef.current = ''; // 重置当前片段文本

        try {
            // 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });

            streamRef.current = stream;
            setIsListening(true);

            // 使用 AudioContext 直接录制
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            audioContextRef.current = audioContext;
            processorRef.current = processor;
            sourceRef.current = source;
            actualSampleRateRef.current = audioContext.sampleRate;

            console.log('🎤 开始录音（WebSocket/单次提交模式），实际采样率:', audioContext.sampleRate, 'Hz');
            console.log('💡 WebSocket 实时推流；若 WS 不可用则停止时一次性提交 REST；最长 300 秒自动结束');

            processor.onaudioprocess = (e) => {
                if (streamRef.current) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const chunk = new Float32Array(inputData);
                    audioChunksRef.current.push(chunk);

                    // 若 WS 已连接，实时推流（重采样到16k后再发）
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        const resampled = resampleTo16k(chunk, audioContext.sampleRate);
                        const pcm16 = floatTo16BitPCM(resampled);
                        wsRef.current.send(pcm16.buffer);
                    }
                }
            };

            // 启用 WebSocket 实时识别
            try {
                const token = await getBaiduAccessToken();
                const cuid = 'golf_frontend_' + Math.random().toString(36).slice(2, 10);
                const devPid = getRealtimeDevPid();
                console.log('🌐 尝试连接 WS:', BAIDU_WS_URL, 'appid:', BAIDU_APP_ID);
                const ws = new WebSocket(`${BAIDU_WS_URL}?sn=${Date.now()}`);
                ws.binaryType = 'arraybuffer';
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('✅ WS 已连接，发送 START 帧');
                    const startPayload = {
                        type: 'START',
                        data: {
                            appid: BAIDU_APP_ID,
                            appkey: BAIDU_API_KEY,
                            cuid,
                            format: 'pcm',
                            sample: 16000,
                            channel: 1,
                            dev_pid: devPid
                        }
                    };
                    console.log('📤 START payload:', JSON.stringify(startPayload, null, 2));
                    ws.send(JSON.stringify(startPayload));
                };

                ws.onmessage = (event) => {
                    console.log('📥 WS 收到消息:', event.data);
                    try {
                        const msg = JSON.parse(event.data);
                        console.log('📩 解析后:', msg);

                        // 处理中间结果 MID_TEXT - 保存当前片段的最新文本
                        if (msg.type === 'MID_TEXT' && msg.result && msg.err_no === 0) {
                            const text = typeof msg.result === 'string' ? msg.result : (Array.isArray(msg.result) ? msg.result.join('') : '');
                            if (text) {
                                currentSegmentTextRef.current = text; // 更新当前片段文本
                                console.log('🎤 中间结果:', text);
                            }
                        }

                        // 处理最终结果 FIN_TEXT - 实时返回
                        if (msg.type === 'FIN_TEXT') {
                            let finalText = '';
                            if (msg.err_no === 0 && msg.result) {
                                // 成功的最终结果
                                finalText = typeof msg.result === 'string' ? msg.result : (Array.isArray(msg.result) ? msg.result.join('') : '');
                            } else if (currentSegmentTextRef.current) {
                                // FIN_TEXT 失败但有中间结果，使用中间结果
                                finalText = currentSegmentTextRef.current;
                                console.log('⚠️ FIN_TEXT 无结果，使用中间结果:', finalText);
                            }

                            if (finalText && onResultCallbackRef.current) {
                                console.log('✅ 实时返回:', finalText);
                                onResultCallbackRef.current(finalText); // 立即回调
                            }
                            currentSegmentTextRef.current = ''; // 重置当前片段
                        }

                        // 处理错误（忽略 -3005 未检测到语音）
                        if (msg.err_no && msg.err_no !== 0 && msg.err_no !== -3005) {
                            console.warn('⚠️ 识别错误:', msg.err_msg);
                        }

                        if (msg.type === 'FINISH') {
                            console.log('🏁 WS 收到 FINISH，关闭连接');
                            ws.close();
                        }
                    } catch (err) {
                        console.warn('❌ 解析 WS 消息失败:', err, event.data);
                    }
                };

                ws.onerror = (err) => {
                    console.error('❌ WS 错误，将回退 REST 提交:', err);
                    wsRef.current = null;
                };

                ws.onclose = (event) => {
                    console.log('🔌 WS 已关闭, code:', event.code, 'reason:', event.reason);
                    wsRef.current = null;
                };
            } catch (wsErr) {
                console.warn('初始化 WS 失败，回退 REST 模式:', wsErr);
                wsRef.current = null;
            }

            source.connect(processor);
            processor.connect(audioContext.destination);

            // 300 秒后自动停止
            timeoutRef.current = setTimeout(() => {
                console.log('⏱️ 已达到300秒最大录音时长，自动停止');
                stopListening();
            }, 300000);

        } catch (error) {
            console.error('启动录音失败:', error);
            setIsListening(false);

            if (error.name === 'NotAllowedError') {
                alert('❌ 麦克风权限被拒绝\n\n请在浏览器地址栏左侧点击锁图标，允许使用麦克风');
            } else if (error.name === 'NotFoundError') {
                alert('未找到麦克风设备，请检查麦克风连接');
            } else {
                alert(`启动语音识别失败: ${error.message}\n请重试或手动输入`);
            }
        }
    }, [isListening, processCurrentSegment]);

    // 停止录音
    const stopListening = useCallback(async () => {
        if (!isListening) return;

        console.log('🛑 停止录音');

        // 清除超时
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // 停止处理器
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // 停止音频源
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // 停止音频流
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsListening(false);

        // 如果有 WebSocket，发送 FINISH 并等待最后的结果
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('📤 发送 FINISH 帧');
            try {
                wsRef.current.send(JSON.stringify({ type: 'FINISH' }));
            } catch (e) {
                console.warn('发送 FINISH 失败:', e);
            }

            // 等待 500ms 让百度返回最后的结果
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 如果还有未提交的中间结果，立即返回
        if (currentSegmentTextRef.current && onResultCallbackRef.current) {
            console.log('📝 返回未完成的中间结果:', currentSegmentTextRef.current);
            onResultCallbackRef.current(currentSegmentTextRef.current);
            currentSegmentTextRef.current = '';
        }

        // 关闭 WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // 关闭音频上下文
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // 重置状态
        lastProcessedIndexRef.current = 0;
        accumulatedTextRef.current = '';
    }, [isListening, processRecording]);

    return {
        isListening,
        startListening,
        stopListening,
        isSecureContext: true,
        hasSupport
    };
};
