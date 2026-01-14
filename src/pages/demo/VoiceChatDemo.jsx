/**
 * VoiceChatDemo - VAD 连续对话演示组件
 * 
 * 用于测试和展示 useVoiceChat hook 的功能
 */

import React, { useState, useCallback } from 'react';
import { useVoiceChat } from '../../hooks/useVoiceChat';

const VoiceChatDemo = () => {
    const [messages, setMessages] = useState([]);
    const [config, setConfig] = useState({
        silenceThreshold: 700,
        energyThreshold: 0.015,
    });

    const handleResult = useCallback((text) => {
        console.log('🎯 识别结果:', text);
        setMessages(prev => [...prev, { type: 'user', text, time: new Date().toLocaleTimeString() }]);

        // 模拟 AI 回复（可以替换为真实 API）
        const reply = `你说的是：「${text}」`;
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'ai', text: reply, time: new Date().toLocaleTimeString() }]);
            speak(reply);
        }, 500);
    }, []);

    const handleSpeechStart = useCallback(() => {
        console.log('🎙️ 开始说话');
    }, []);

    const handleSpeechEnd = useCallback(() => {
        console.log('🛑 结束说话');
    }, []);

    const handleTtsInterrupt = useCallback(() => {
        console.log('⚡ TTS 被打断');
        setMessages(prev => [...prev, { type: 'system', text: '[TTS 被打断]', time: new Date().toLocaleTimeString() }]);
    }, []);

    const handleError = useCallback((err) => {
        console.error('❌ 错误:', err);
        setMessages(prev => [...prev, { type: 'error', text: err.message, time: new Date().toLocaleTimeString() }]);
    }, []);

    const {
        isActive,
        isSpeaking,
        isProcessing,
        isTtsPlaying,
        error,
        start,
        stop,
        speak,
        stopTts,
    } = useVoiceChat({
        onResult: handleResult,
        onError: handleError,
        onSpeechStart: handleSpeechStart,
        onSpeechEnd: handleSpeechEnd,
        onTtsInterrupt: handleTtsInterrupt,
        ...config,
    });

    const getStatusText = () => {
        if (!isActive) return '未启动';
        if (isProcessing) return '识别中...';
        if (isSpeaking) return '正在说话...';
        if (isTtsPlaying) return 'TTS 播放中...';
        return '等待说话...';
    };

    const getStatusColor = () => {
        if (!isActive) return '#888';
        if (isProcessing) return '#f39c12';
        if (isSpeaking) return '#e74c3c';
        if (isTtsPlaying) return '#3498db';
        return '#2ecc71';
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🎤 VAD 连续对话演示</h1>

            {/* 状态面板 */}
            <div style={styles.statusPanel}>
                <div style={styles.statusItem}>
                    <span style={styles.statusLabel}>状态:</span>
                    <span style={{ ...styles.statusValue, color: getStatusColor() }}>
                        {getStatusText()}
                    </span>
                </div>
                <div style={styles.statusDots}>
                    <span style={{ ...styles.dot, backgroundColor: isActive ? '#2ecc71' : '#888' }} title="麦克风" />
                    <span style={{ ...styles.dot, backgroundColor: isSpeaking ? '#e74c3c' : '#888' }} title="说话中" />
                    <span style={{ ...styles.dot, backgroundColor: isProcessing ? '#f39c12' : '#888' }} title="识别中" />
                    <span style={{ ...styles.dot, backgroundColor: isTtsPlaying ? '#3498db' : '#888' }} title="TTS" />
                </div>
            </div>

            {/* 控制按钮 */}
            <div style={styles.controls}>
                {!isActive ? (
                    <button onClick={start} style={{ ...styles.button, backgroundColor: '#2ecc71' }}>
                        🎙️ 启动对话
                    </button>
                ) : (
                    <button onClick={stop} style={{ ...styles.button, backgroundColor: '#e74c3c' }}>
                        🛑 停止对话
                    </button>
                )}
                {isTtsPlaying && (
                    <button onClick={stopTts} style={{ ...styles.button, backgroundColor: '#f39c12' }}>
                        🔇 停止播放
                    </button>
                )}
            </div>

            {/* 配置面板 */}
            <div style={styles.configPanel}>
                <h3 style={styles.configTitle}>⚙️ 配置参数</h3>
                <div style={styles.configItem}>
                    <label>静音阈值 (ms):</label>
                    <input
                        type="range"
                        min="300"
                        max="2000"
                        value={config.silenceThreshold}
                        onChange={(e) => setConfig(prev => ({ ...prev, silenceThreshold: Number(e.target.value) }))}
                        disabled={isActive}
                    />
                    <span>{config.silenceThreshold}ms</span>
                </div>
                <div style={styles.configItem}>
                    <label>能量阈值:</label>
                    <input
                        type="range"
                        min="0.005"
                        max="0.05"
                        step="0.001"
                        value={config.energyThreshold}
                        onChange={(e) => setConfig(prev => ({ ...prev, energyThreshold: Number(e.target.value) }))}
                        disabled={isActive}
                    />
                    <span>{config.energyThreshold.toFixed(3)}</span>
                </div>
                <p style={styles.configHint}>注：修改配置需要先停止再启动</p>
            </div>

            {/* 消息列表 */}
            <div style={styles.messageList}>
                <h3 style={styles.messagesTitle}>💬 对话记录</h3>
                {messages.length === 0 ? (
                    <p style={styles.emptyHint}>启动后开始说话，系统会自动检测并识别...</p>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                ...styles.message,
                                ...(msg.type === 'user' ? styles.userMessage : {}),
                                ...(msg.type === 'ai' ? styles.aiMessage : {}),
                                ...(msg.type === 'system' ? styles.systemMessage : {}),
                                ...(msg.type === 'error' ? styles.errorMessage : {}),
                            }}
                        >
                            <span style={styles.messageIcon}>
                                {msg.type === 'user' ? '👤' : msg.type === 'ai' ? '🤖' : msg.type === 'system' ? 'ℹ️' : '❌'}
                            </span>
                            <span style={styles.messageText}>{msg.text}</span>
                            <span style={styles.messageTime}>{msg.time}</span>
                        </div>
                    ))
                )}
            </div>

            {/* 清除按钮 */}
            {messages.length > 0 && (
                <button
                    onClick={() => setMessages([])}
                    style={{ ...styles.button, backgroundColor: '#95a5a6', marginTop: '10px' }}
                >
                    🗑️ 清除记录
                </button>
            )}

            {/* 错误显示 */}
            {error && (
                <div style={styles.errorBox}>
                    ❌ {error}
                </div>
            )}

            {/* 使用说明 */}
            <div style={styles.instructions}>
                <h3>📖 使用说明</h3>
                <ul>
                    <li>点击"启动对话"开始，麦克风会保持开启状态</li>
                    <li>直接说话，系统会自动检测语音开始和结束</li>
                    <li>静音超过设定阈值后自动触发识别</li>
                    <li>在 AI 播放回复时说话可以打断它（Barge-in）</li>
                    <li>调整"能量阈值"可以适应不同噪音环境</li>
                </ul>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    title: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
    },
    statusPanel: {
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    statusLabel: {
        color: '#666',
    },
    statusValue: {
        fontWeight: 'bold',
        fontSize: '1.1em',
    },
    statusDots: {
        display: 'flex',
        gap: '8px',
    },
    dot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        transition: 'background-color 0.2s',
    },
    controls: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '15px',
    },
    button: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        transition: 'transform 0.1s, box-shadow 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    configPanel: {
        backgroundColor: '#e8f4fd',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '15px',
    },
    configTitle: {
        margin: '0 0 10px 0',
        color: '#2980b9',
    },
    configItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
    },
    configHint: {
        fontSize: '12px',
        color: '#666',
        margin: '5px 0 0 0',
    },
    messageList: {
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '10px',
        padding: '15px',
        maxHeight: '300px',
        overflowY: 'auto',
    },
    messagesTitle: {
        margin: '0 0 10px 0',
        color: '#333',
    },
    emptyHint: {
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    message: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        marginBottom: '8px',
        borderRadius: '8px',
    },
    userMessage: {
        backgroundColor: '#e8f8e8',
    },
    aiMessage: {
        backgroundColor: '#e8f4fd',
    },
    systemMessage: {
        backgroundColor: '#fff3cd',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
    },
    messageIcon: {
        fontSize: '20px',
    },
    messageText: {
        flex: 1,
        wordBreak: 'break-word',
    },
    messageTime: {
        fontSize: '11px',
        color: '#999',
    },
    errorBox: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '10px 15px',
        borderRadius: '8px',
        marginTop: '15px',
    },
    instructions: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#666',
    },
};

export default VoiceChatDemo;
