'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '@/lib/types/ai';

interface ConversationPanelProps {
    messages: ChatMessage[];
    isStreaming: boolean;
}

export default function ConversationPanelV2({ messages, isStreaming }: ConversationPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playingIndex, setPlayingIndex] = React.useState<number | null>(null);
    const [showTranslations, setShowTranslations] = React.useState<Record<number, boolean>>({});

    // 단어 수 계산
    const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handlePlay = (text: string, index: number, isUserAudio = false, audioUrl?: string) => {
        if (playingIndex === index) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingIndex(null);
            return;
        }

        if (audioRef.current) audioRef.current.pause();

        let audio: HTMLAudioElement;
        if (isUserAudio && audioUrl) {
            audio = new Audio(audioUrl);
        } else {
            const voice = 'alloy';
            const ttsUrl = `/api/ai/v2/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
            audio = new Audio(ttsUrl);
        }

        audioRef.current = audio;
        audio.onplay = () => setPlayingIndex(index);
        audio.onended = () => { setPlayingIndex(null); audioRef.current = null; };
        audio.onerror = () => { console.error('Audio playback failed'); setPlayingIndex(null); };
        audio.play().catch(console.error);
    };

    const toggleTranslation = (index: number) => {
        setShowTranslations(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const userMessages = messages.filter(m => m.role === 'user');

    return (
        <div className="ai-conversation-thread">
            {messages.filter(msg => msg.role !== 'system').map((msg, i) => {
                const isUser = msg.role === 'user';
                const turnIndex = isUser ? userMessages.indexOf(msg) + 1 : -1;

                return (
                    <div key={i} className={`ai-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
                        {/* 사용자 턴/단어 정보 */}
                        {isUser && (
                            <div className="ai-message-stats">
                                {turnIndex}턴 | {getWordCount(msg.content)} 단어
                            </div>
                        )}

                        <div className={`ai-message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                            <div className="ai-message-inner">
                                <div className="ai-message-avatar">
                                    {isUser ? '👤' : '🤖'}
                                </div>
                                
                                <div className="ai-message-body">
                                    <div className="ai-text-content">{msg.content}</div>
                                    
                                    {!isUser && msg.translation && showTranslations[i] && (
                                        <div className="ai-translation-box">
                                            {msg.translation}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 하단 액션바 */}
                            <div className="ai-bubble-actions">
                                {!isUser && (
                                    <>
                                        <button 
                                            className={`ai-action-btn-pill ${playingIndex === i ? 'is-playing' : ''}`}
                                            onClick={() => handlePlay(msg.content, i)}
                                        >
                                            {playingIndex === i ? '⏹ Stop' : '🔊 Listen AI'}
                                        </button>
                                        <button className="ai-action-btn-text" onClick={() => toggleTranslation(i)}>
                                            {showTranslations[i] ? '번역 숨기기' : '한글 번역 보기'}
                                        </button>
                                    </>
                                )}
                                {isUser && msg.audioUrl && (
                                    <button 
                                        className={`ai-action-btn-text ${playingIndex === i ? 'is-playing' : ''}`} 
                                        onClick={() => handlePlay('', i, true, msg.audioUrl)}
                                    >
                                        {playingIndex === i ? '⏹ Stop' : '🎧 Play My Voice'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {isStreaming && (
                <div className="ai-streaming-indicator">
                    <div className="ai-dot-pulse" />
                    <span>AI가 생각 중입니다...</span>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
