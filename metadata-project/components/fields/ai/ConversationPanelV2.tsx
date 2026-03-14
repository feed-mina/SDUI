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
        <div className="conversation-panel flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.filter(msg => msg.role !== 'system').map((msg, i) => {
                const isUser = msg.role === 'user';
                const turnIndex = isUser ? userMessages.indexOf(msg) + 1 : -1;

                return (
                    <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        {/* 사용자 턴/단어 정보 */}
                        {isUser && (
                            <div className="msg-stats mb-1 mr-1 text-xs text-gray-400">
                                {turnIndex}턴 | {getWordCount(msg.content)} 단어
                            </div>
                        )}

                        <div className={`message-bubble message-${msg.role} w-full max-w-[85%]`}>
                            <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="message-avatar flex-shrink-0">
                                    {isUser ? '👤' : '🤖'}
                                </div>
                                
                                <div className="message-content shadow-sm flex-1">
                                    <div className="text-content whitespace-pre-wrap">{msg.content}</div>
                                    
                                    {!isUser && msg.translation && showTranslations[i] && (
                                        <div className="translation-text border-t border-dashed border-gray-100 mt-2 pt-2 text-sm text-gray-500">
                                            {msg.translation}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 하단 액션바 */}
                            <div className={`bubble-actions px-1 mt-1 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                {!isUser && (
                                    <>
                                        <button 
                                            className={`action-btn-main ${playingIndex === i ? 'playing' : ''}`}
                                            onClick={() => handlePlay(msg.content, i)}
                                            title="AI 목소리 듣기"
                                        >
                                            {playingIndex === i ? '⏹ Stop' : '🔊 Listen AI'}
                                        </button>
                                        <button className="action-btn-mini text-xs opacity-60 hover:opacity-100" onClick={() => toggleTranslation(i)}>
                                            {showTranslations[i] ? '번역 숨기기' : '한글 번역 보기'}
                                        </button>
                                    </>
                                )}
                                {isUser && msg.audioUrl && (
                                    <button 
                                        className={`action-btn-mini text-xs ${playingIndex === i ? 'text-red-500' : 'opacity-60'}`} 
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
                <div className="flex items-center gap-2 text-gray-400 text-sm ml-2 animate-pulse">
                    AI가 생각 중입니다...
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
