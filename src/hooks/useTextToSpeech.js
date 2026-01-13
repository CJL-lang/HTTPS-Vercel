import { useState, useRef } from 'react';

// 百度语音合成 API 配置（与语音识别共用）
const BAIDU_API_KEY = 'j0xBgZAd65ydvM9zO36SqNmL';
const BAIDU_SECRET_KEY = 'Q0KztLX8lcIUu6JpzWVEx8MwgnbgW6EL';

// 缓存 access_token
let cachedToken = null;
let tokenExpireTime = 0;

// 获取百度 access_token（带缓存）
const getBaiduAccessToken = async () => {
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
            tokenExpireTime = Date.now() + (29 * 24 * 60 * 60 * 1000);
            return cachedToken;
        }
        throw new Error(data.error_description || '获取 token 失败');
    } catch (error) {
        console.error('获取百度 access_token 失败:', error);
        throw error;
    }
};

// 调用百度语音合成 API
const synthesizeSpeech = async (text, options = {}) => {
    // 检查文本长度（百度限制 2048 字符）
    if (!text || text.length === 0) {
        throw new Error('文本内容为空');
    }
    if (text.length > 2048) {
        console.warn('文本超长，截断至 2048 字符');
        text = text.substring(0, 2048);
    }

    const accessToken = await getBaiduAccessToken();
    const cuid = 'golf_frontend_' + Math.random().toString(36).substr(2, 9);

    // 构建请求体（使用 POST + form-urlencoded）
    const params = new URLSearchParams({
        tex: text,                          // 要合成的文本
        tok: accessToken,                   // access_token
        cuid: cuid,                         // 用户唯一标识
        ctp: '1',                           // 客户端类型：1=Web，必填
        lan: options.lan || 'zh',           // 语言，zh:中文 en:英文
        spd: String(options.spd || '5'),    // 语速，0-15
        pit: String(options.pit || '5'),    // 音调，0-15
        vol: String(options.vol || '5'),    // 音量，0-15
        per: String(options.per || '0'),    // 发音人
        aue: String(options.aue || '3')     // 音频格式
    });

    console.log('🔊 TTS 请求参数:', { text: text.substring(0, 50), token: accessToken.substring(0, 20) + '...', cuid });

    try {
        const response = await fetch(`/baidu-tts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS 请求失败: ${response.status} ${errorText}`);
        }

        // 检查是否返回 JSON 错误
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(`TTS 错误: ${errorData.err_msg || errorData.err_no}`);
        }

        // 返回音频 Blob
        const audioBlob = await response.blob();
        return audioBlob;
    } catch (error) {
        console.error('百度语音合成失败:', error);
        throw error;
    }
};

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(null);

    // 播放文本
    const speak = async (text, options = {}) => {
        if (!text || text.trim().length === 0) {
            console.warn('文本为空，无法合成语音');
            return;
        }

        // 如果正在播放，先停止之前的播放
        if (audioRef.current) {
            console.log('🛑 停止之前的语音播放');
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        try {
            setIsSpeaking(true);
            console.log('🔊 开始合成语音:', text);

            const audioBlob = await synthesizeSpeech(text, options);
            const audioUrl = URL.createObjectURL(audioBlob);

            // 创建音频元素并播放
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                console.log('✅ 语音播放完成');
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            audio.onerror = (error) => {
                console.error('❌ 音频播放失败:', error);
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            await audio.play();
            console.log('🎵 语音播放中...');
        } catch (error) {
            console.error('语音合成失败:', error);
            setIsSpeaking(false);
            throw error;
        }
    };

    // 停止播放
    const stop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsSpeaking(false);
        console.log('🛑 停止语音播放');
    };

    return {
        isSpeaking,
        speak,
        stop
    };
};
