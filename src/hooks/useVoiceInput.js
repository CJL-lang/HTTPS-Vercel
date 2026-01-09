import { useState, useRef, useCallback } from 'react';

// 百度语音识别 API 配置
const BAIDU_API_KEY = 'j0xBgZAd65ydvM9zO36SqNmL';
const BAIDU_SECRET_KEY = 'Q0KztLX8lcIUu6JpzWVEx8MwgnbgW6EL';

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

// 将 ArrayBuffer 转换为 base64
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// 调用百度语音识别 API
const recognizeSpeech = async (pcmData, accessToken) => {
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
        dev_pid: 1537  // 1537=普通话(支持简单的英文识别), 1737=英语, 1637=粤语
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
    const onResultCallbackRef = useRef(null);
    const timeoutRef = useRef(null);

    // 检查浏览器是否支持必要的 API
    useState(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasSupport(false);
        }
    });

    // 开始录音
    const startListening = useCallback(async (onResult) => {
        if (isListening) return;

        onResultCallbackRef.current = onResult;

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

            const audioChunks = [];
            const actualSampleRate = audioContext.sampleRate;

            console.log('开始录音，实际采样率:', actualSampleRate, 'Hz');

            processor.onaudioprocess = (e) => {
                if (streamRef.current) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    audioChunks.push(new Float32Array(inputData));
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // 8秒后自动停止（增加录音时长以获得更好的识别效果）
            timeoutRef.current = setTimeout(async () => {
                // 停止录音
                processor.disconnect();
                source.disconnect();

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                setIsListening(false);
                console.log('录音已停止');

                // 合并音频数据
                const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                const mergedAudio = new Float32Array(totalLength);
                let offset = 0;
                for (const chunk of audioChunks) {
                    mergedAudio.set(chunk, offset);
                    offset += chunk.length;
                }

                const duration = totalLength / actualSampleRate;
                console.log('原始音频:', totalLength, '采样点,', duration.toFixed(2), '秒');

                if (duration < 0.5) {
                    alert('录音时间太短，请重试');
                    audioContext.close();
                    return;
                }

                // 检查音频质量 - 计算平均音量
                let sumSquares = 0;
                for (let i = 0; i < mergedAudio.length; i++) {
                    sumSquares += mergedAudio[i] * mergedAudio[i];
                }
                const rms = Math.sqrt(sumSquares / mergedAudio.length);
                const dbfs = 20 * Math.log10(rms);
                console.log('音频音量 RMS:', rms.toFixed(6), 'dBFS:', dbfs.toFixed(2));

                if (rms < 0.001) {
                    alert('未检测到有效音频信号，请检查麦克风或提高音量');
                    audioContext.close();
                    return;
                }

                try {
                    // 重采样到 16000Hz
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

                    console.log('重采样后:', resampled.length, '采样点');

                    // 检查重采样后的音频质量
                    let resampledRms = 0;
                    for (let i = 0; i < resampled.length; i++) {
                        resampledRms += resampled[i] * resampled[i];
                    }
                    resampledRms = Math.sqrt(resampledRms / resampled.length);
                    console.log('重采样后音量 RMS:', resampledRms.toFixed(6));

                    // 转换为 16-bit PCM
                    const pcmData = floatTo16BitPCM(resampled);
                    console.log('PCM 数据字节数:', pcmData.buffer.byteLength);

                    // 输出前 20 个 PCM 样本用于调试
                    console.log('PCM 前 20 个样本:', Array.from(pcmData.slice(0, 20)));

                    // 获取 token 并识别
                    const accessToken = await getBaiduAccessToken();
                    const result = await recognizeSpeech(pcmData, accessToken);

                    if (result && onResultCallbackRef.current) {
                        onResultCallbackRef.current(result);
                    }
                } catch (error) {
                    console.error('处理音频失败:', error);
                    alert(`语音识别失败: ${error.message}\n请重试或手动输入`);
                }

                audioContext.close();
            }, 8000);  // 改为 8 秒

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
    }, [isListening]);

    // 停止录音
    const stopListening = useCallback(() => {
        // 清除超时
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // 停止音频流
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsListening(false);
    }, []);

    return {
        isListening,
        startListening,
        stopListening,
        isSecureContext: true,
        hasSupport
    };
};
