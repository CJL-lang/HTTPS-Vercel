/**
 * VoiceInputTest - 测试原有的 useVoiceInput 是否能正常识别
 */

import React, { useState } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

const VoiceInputTest = () => {
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const { isListening, startListening, stopListening } = useVoiceInput();

    const handleStart = () => {
        setError('');
        setResult('');
        startListening((text) => {
            console.log('🎯 识别结果:', text);
            setResult(text);
        });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>🧪 原始 useVoiceInput 测试</h1>
            <p>测试原有的 REST API 短语音识别是否可用</p>

            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={isListening ? stopListening : handleStart}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: isListening ? '#e74c3c' : '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {isListening ? '🛑 停止录音' : '🎤 开始录音'}
                </button>
            </div>

            {result && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e8f8e8',
                    borderRadius: '8px'
                }}>
                    <strong>识别结果：</strong> {result}
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '8px',
                    color: '#721c24'
                }}>
                    <strong>错误：</strong> {error}
                </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                <p>⚠️ 注意：原有的 useVoiceInput 使用 WebSocket 实时识别 + REST 短语音识别回退机制</p>
                <p>打开浏览器控制台查看详细日志</p>
            </div>
        </div>
    );
};

export default VoiceInputTest;
