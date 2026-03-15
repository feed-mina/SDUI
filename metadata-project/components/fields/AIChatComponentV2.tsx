'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AIChatConfig, ChatMessage } from '@/lib/types/ai';
import { useSSEStreamV2 } from '@/lib/hooks/useSSEStreamV2';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import ConversationPanelV2 from '@/components/fields/ai/ConversationPanelV2';
import AudioRecorder from '@/components/fields/ai/AudioRecorder';
import MembershipUpgradeModal from '@/components/fields/ai/MembershipUpgradeModal';
import api from '@/services/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

// DynamicEngine이 전달하는 표준 props
interface AIChatComponentV2Props {
    meta: {
        labelText?: string;
        label_text?: string;
        cssClass?: string;
        css_class?: string;
        actionType?: string;
        action_type?: string;
        placeholder?: string;
        isReadonly?: boolean;
        is_readonly?: boolean;
    };
    data?: AIChatConfig;
    [key: string]: any;
}

export default function AIChatComponentV2({ meta, data }: AIChatComponentV2Props) {
    // ── 메타데이터에서 읽기 ──
    const title = meta.labelText || meta.label_text || 'AI 대화 V2';
    const containerClass = meta.cssClass || meta.css_class || '';
    const isDisabled = meta.isReadonly === true || meta.is_readonly === true;
    const actionType = meta.actionType || meta.action_type || '';
    const language = (data?.language as 'en' | 'ko') ?? (actionType.includes('EN') ? 'en' : 'ko');

    // query_master 설정값
    const micBtnLabel = data?.mic_btn_label ?? '🎤 Start Recording';
    const submitBtnLabel = data?.submit_btn_label ?? 'Submit';
    const endBtnLabel = data?.end_btn_label ?? 'End Chat';
    const welcomeMessage = data?.welcome_message ?? '';
    const upgradeMessage = data?.upgrade_message ?? 'Voice conversation requires a PREMIUM membership.';

    // ── 상태 ──
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeModalMsg, setUpgradeModalMsg] = useState(upgradeMessage);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const hasShownGoalRef = useRef(false); // 중복 트리거 방지용 Ref
    const userMessageCount = useMemo(() => messages.filter(m => m.role === 'user').length, [messages]);
    
    // 목표 달성 모달 감시 (Ref를 사용하여 딱 한 번만 트리거되도록 수정)
    useEffect(() => {
        if (userMessageCount === 10 && !hasShownGoalRef.current) {
            setShowGoalModal(true);
            hasShownGoalRef.current = true;
        }
    }, [userMessageCount]);
    const conversationStartedRef = useRef(false);

    // ── V2 SSE 스트림 훅 (/api/ai/v2/chat/stream 사용) ──
    const { stream, abort } = useSSEStreamV2({
        onChunk: (chunk) => {
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                    return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
                }
                return [...prev, { role: 'assistant', content: chunk }];
            });
        },
        onDone: () => handleDone(), // handleDone 호출
        onError: (msg) => {
            setIsStreaming(false);
            setUpgradeModalMsg(msg || upgradeMessage);
            setShowUpgradeModal(true);
        },
    });

    const [isStarted, setIsStarted] = useState(false); // 진입 화면 상태

    // AI에게 메시지 전송 (JSON 응답 요청: en, ko)
    const sendToAI = useCallback(async (msgs: ChatMessage[]) => {
        setIsStreaming(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const systemMsg: ChatMessage = {
            role: 'system',
            content: `You are a professional and engaging English tutor.
            YOUR GOAL: Help the user improve their English through natural conversation.
            
            CORE INSTRUCTIONS:
            1. BE CONVERSATIONAL: Never just echo or translate the user's input. Respond human-like, give feedback on their English if needed, and always end with an open-ended question to keep the dialogue moving.
            2. TEACHER INSIGHT: If the user makes a mistake or sounds unnatural, provide a "Better way to say it" in your response.
            3. ENGLISH ONLY: Your conversation must be 100% English.
            4. JSON RESPONSE: You MUST respond in this JSON format:
               {
                 "en": "Your proactive tutor response (in English)",
                 "ko": "A natural Korean translation of your response (for the user's reference)"
               }
            Do not include any other text.`
        };
        const messagesWithSystem = [systemMsg, ...msgs];

        await stream('/api/ai/v2/chat/stream', { messages: messagesWithSystem, language });
    }, [stream, language]);

    const handleStart = () => {
        setIsStarted(true);
    };

    // 스트리밍 종료 시 JSON 파싱 처리 (더 견고하게 고도화)
    const handleDone = useCallback(() => {
        setIsStreaming(false);
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.content) {
                try {
                    // 1. JSON 형태의 블록들을 모두 찾음 (최대한 유연하게)
                    const jsonBlocks = last.content.match(/\{[\s\S]*?\}/g);
                    if (jsonBlocks && jsonBlocks.length > 0) {
                        // 가장 마지막에 나타난 JSON 블록을 선택 (보통 AI가 최종적으로 뱉는 정보)
                        const lastJsonStr = jsonBlocks[jsonBlocks.length - 1];
                        const parsed = JSON.parse(lastJsonStr);
                        
                        if (parsed.en || parsed.ko) {
                            return [...prev.slice(0, -1), { 
                                ...last, 
                                content: parsed.en || last.content, 
                                translation: parsed.ko 
                            }];
                        }
                    }
                } catch (e) {
                    console.warn('[V2] JSON 파싱 실패, 원문 그대로 유지:', e);
                }
            }
            return prev;
        });
    }, []);

    // ── V2 STT: koreanMode 기반으로 language 결정 ──

    // ── 마운트 시: 멤버십 체크 + 환영 메시지 ──
    useEffect(() => {
        if (isDisabled) return;

        const init = async () => {
            try {
                await api.get('/api/v1/user-memberships/current');
            } catch (err: any) {
                const status = err?.response?.status;
                if (status === 401) return;
            }

            if (welcomeMessage && !conversationStartedRef.current) {
                conversationStartedRef.current = true;
                setMessages([{ role: 'assistant', content: welcomeMessage }]);
            }
        };

        init();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [currentRecordingMode, setCurrentRecordingMode] = useState<'en' | 'ko'>('en');

    // ── V2 STT: mode 기반으로 language 결정 ──
    const { state: recordingState, startRecording, stopRecording, cancelRecording, resetState } = useAudioRecorder({
        onAudioReady: async (blob) => {
            try {
                const formData = new FormData();
                formData.append('audio', blob, 'recording.webm');

                // V2: 사용자가 선택한 모드에 따라 STT 언어 및 번역 여부 결정
                const sttLanguage = currentRecordingMode === 'ko' ? 'ko' : 'en';
                console.log(`[V2 STT] 모드: ${currentRecordingMode}, STT 언어: ${sttLanguage}`);

                const res = await api.post('/api/ai/stt', formData, {
                    params: { language: sttLanguage },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                let transcript: string = res.data?.data?.text || '';

                if (!transcript.trim()) {
                    resetState();
                    return;
                }

                // [Phase 18] 한글 포함 여부 체크 시 공백/특수문자 제외하고 검사
                const containsKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(transcript.replace(/\s/g, ''));
                
                if (currentRecordingMode === 'ko' || containsKorean) {
                    console.log(`[Phase 19] 번역 수행 (모드: ${currentRecordingMode}, 한글여부: ${containsKorean})`);
                    try {
                        const transRes = await api.post('/api/ai/v2/chat/translate', { 
                            text: transcript, 
                            target: 'en' 
                        });
                        if (transRes.data && transRes.data.data) {
                            transcript = transRes.data.data;
                            console.log('[Phase 19] 번역 완료 텍스트:', transcript);
                        }
                    } catch (e) {
                        console.error('[Phase 19] 번역 API 호출 실패 (404/ServerError):', e);
                        // 실패 시 최소한 한국어라도 표시되게 유지하되, 로그를 남김
                    }
                }

                const audioUrl = URL.createObjectURL(blob);
                const userMsg: ChatMessage = { 
                    role: 'user', 
                    content: transcript, // 이제 항상 영어이거나 영어로 번역된 텍스트가 들어감
                    audioUrl: audioUrl 
                };
                const updatedMsgs = [...messages, userMsg];
                setMessages(updatedMsgs);
                resetState();
                await sendToAI(updatedMsgs);
            } catch {
                resetState();
            }
        },
        onAnalyser: setAnalyser,
    });

    const handleStartRecording = (mode: 'en' | 'ko') => {
        setCurrentRecordingMode(mode);
        startRecording();
    };

    // ── 대화 종료 ──
    const handleEnd = () => {
        abort();
        setMessages([]);
        conversationStartedRef.current = false;
    };

    return (
        <div 
            className={`ai-chat-container AI_ENGLISH_CHAT_PAGE ${containerClass}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: '100vh', background: '#F5F7FA' }}
        >
            {!isStarted ? (
                <div className="intro-screen">
                    <div className="intro-icon-box" style={{ background: '#3F51B5' }}>
                        <svg 
                            viewBox="0 0 24 24" 
                            fill="white" 
                            style={{ width: '80px', height: '80px', display: 'block' }}
                        >
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                    </div>
                    
                    <div className="text-center mb-10">
                        <h1 className="intro-title text-4xl font-extrabold mb-2" style={{ color: '#1A237E' }}>
                            AI English Tutor
                        </h1>
                        <p className="text-gray-400 font-medium">Elevate your English with AI</p>
                    </div>

                    <div className="mic-permission-box">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <span className="text-2xl">🎤</span>
                            <span className="text-[#1A237E] font-bold text-xl">마이크 사용 권한</span>
                        </div>
                        <p className="text-gray-500 text-base leading-relaxed mb-8">
                            링글 AI와 영어로 대화를 나누기 위해서는<br/>
                            마이크 사용 권한이 필요해요.
                        </p>
                        <div className="w-full h-[1px] bg-gray-100 mb-8" />
                        <p className="text-[#3F51B5] font-extrabold text-lg mb-8">마이크를 눌러 녹음을 진행해주세요.</p>
                        <button className="start-chat-btn" onClick={handleStart}>
                            대화 시작하기
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div 
                        className="ai-chat-header w-full" 
                        style={{ background: '#fff', borderBottom: '1px solid #E0E4E8', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                            <h2 className="ai-chat-title text-[#1A237E] font-bold text-lg m-0">AI English Tutor</h2>
                            <span className="ai-status-tag ml-3 text-xs opacity-60 font-medium">Live · Premium V2</span>
                        </div>
                        
                        <div className="gauge-container" style={{ position: 'relative', width: '100%', maxWidth: '300px', height: '6px', background: '#E8EAF6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                                className="gauge-fill" 
                                style={{ 
                                    width: `${Math.min((userMessageCount / 10) * 100, 100)}%`,
                                    height: '100%',
                                    background: userMessageCount >= 10 ? 'linear-gradient(90deg, #FFD700, #FFA000)' : 'linear-gradient(90deg, #3949AB, #5C6BC0)',
                                    transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }} 
                            />
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col">
                        <ConversationPanelV2 
                            messages={messages} 
                            isStreaming={isStreaming} 
                        />
                    </div>

                    <div className="ai-chat-input-area w-full border-t border-gray-100 bg-white">
                        <div className="max-w-4xl mx-auto">
                            <AudioRecorder 
                                state={recordingState}
                                analyser={analyser}
                                micBtnLabel={micBtnLabel}
                                submitBtnLabel={submitBtnLabel}
                                onStart={handleStartRecording}
                                onStop={stopRecording}
                                onCancel={cancelRecording}
                                disabled={isDisabled || isStreaming}
                                className="audio-recorder-bar"
                                micClassName="mic-btn-main"
                            />
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <div className="max-w-4xl mx-auto w-full px-4 pb-6">
                            <button className="end-session-btn" onClick={handleEnd}>
                                채팅종료하기
                            </button>
                        </div>
                    )}
                </>
            )}

            <MembershipUpgradeModal
                isOpen={showUpgradeModal}
                message={upgradeModalMsg}
                onClose={() => setShowUpgradeModal(false)}
            />

            {/* Goal Celebration Modal (Framer Motion 적용 및 디자인 개선) */}
            <AnimatePresence>
                {showGoalModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', zIndex: 10000, padding: '24px',
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.7, y: 100, rotate: -5 }}
                            animate={{ scale: 1, y: 0, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="rounded-[32px] p-10 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] relative overflow-hidden"
                            style={{ border: '3px solid #FFD700', backgroundColor: '#FFFFFF' }}
                        >
                            {/* Decorative Background Flash */}
                            <div style={{ position: 'absolute', top: -50, left: -50, width: 100, height: 100, background: 'rgba(255,215,0,0.2)', borderRadius: '50%', filter: 'blur(30px)' }} />

                            <div className="text-7xl mb-6 transform hover:scale-110 transition-transform">🏆</div>
                            <h2 className="text-3xl font-black text-[#1A237E] mb-3 tracking-tight">MISSION SUCCESS!</h2>
                            <div className="w-16 h-1 bg-[#FFD700] mx-auto mb-6 rounded-full" />
                            
                            <p className="text-lg text-gray-700 font-medium mb-10 leading-relaxed">
                                Amazing job! <br/>
                                You've reached <span className="text-[#3F51B5] font-bold">10 Turns</span> today.<br/>
                                Consistency is the key to fluency.
                            </p>
                            
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowGoalModal(false)}
                                className="w-full py-5 bg-[#3F51B5] text-white rounded-[20px] font-bold text-xl shadow-[0_10px_25px_rgba(63,81,181,0.3)] hover:bg-[#303F9F] transition-all"
                            >
                                Continue Learning
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
