import { useState, useEffect } from 'react';

export const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [isSecureContext, setIsSecureContext] = useState(true);

    useEffect(() => {
        // 检查是否为安全上下文 (HTTPS 或 localhost)
        const isSecure = window.isSecureContext ||
            window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        setIsSecureContext(isSecure);

        // 检查浏览器支持
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            return;
        }

        if (!isSecure) {

            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'zh-CN'; // 中文识别
        recognitionInstance.continuous = false; // 单次识别
        recognitionInstance.interimResults = false; // 不返回临时结果

        setRecognition(recognitionInstance);

        return () => {
            if (recognitionInstance) {
                recognitionInstance.abort();
            }
        };
    }, []);

    const startListening = (onResult) => {
        // 检查是否为安全上下文
        if (!isSecureContext) {
            const currentUrl = window.location.href;
            const localhostUrl = currentUrl.replace(/192\.168\.\d+\.\d+/, 'localhost');

            alert(`⚠️ 语音识别需要安全环境\n\n通过局域网 IP 访问时，浏览器出于安全考虑会禁用语音识别功能。\n\n✅ 推荐解决方案：\n在同一台电脑上使用以下地址访问：\n${localhostUrl}\n\n📝 或者：\n直接在输入框中手动输入文字`);
            return;
        }

        if (!recognition) {
            alert('您的浏览器不支持语音识别功能，请使用最新版 Chrome 或 Edge 浏览器');
            return;
        }

        try {
            setIsListening(true);

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event) => {

                if (event.error === 'not-allowed') {
                    alert('❌ 麦克风权限被拒绝\n\n请在浏览器地址栏左侧点击锁图标，允许使用麦克风');
                } else if (event.error === 'no-speech') {
                    alert('未检测到语音，请重试');
                } else if (event.error === 'network') {
                    alert('网络错误，语音识别需要连接互联网');
                } else {
                    alert(`语音识别失败: ${event.error}\n请重试或手动输入`);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } catch (error) {

            setIsListening(false);
            alert('启动语音识别失败，请重试或手动输入');
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
        }
    };

    return {
        isListening,
        startListening,
        stopListening,
        isSecureContext,
        hasSupport: !!recognition
    };
};
