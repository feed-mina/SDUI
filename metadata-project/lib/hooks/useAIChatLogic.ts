import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, RecordingState } from '@/lib/types/ai';
import { useSSEStreamV2 } from '@/lib/hooks/useSSEStreamV2';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import api from '@/services/axios';

interface UseAIChatLogicProps {
    language: string; // 'en', 'ko', 'ja' 등
    systemPrompt: string;
    welcomeMessage?: string;
    sttEndpoint?: string;
    chatEndpoint?: string;
    translateEndpoint?: string;
    onGoalAchieved?: () => void;
    onError?: (msg: string) => void;
}

export function useAIChatLogic({
    language,
    systemPrompt,
    welcomeMessage,
    sttEndpoint = '/api/ai/stt',
    chatEndpoint = '/api/ai/v2/chat/stream',
    translateEndpoint = '/api/ai/v2/chat/translate',
    onGoalAchieved,
    onError
}: UseAIChatLogicProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const [currentRecordingMode, setCurrentRecordingMode] = useState<string>(language);
    
    const conversationStartedRef = useRef(false);
    const hasTriggeredGoalRef = useRef(false);
    const userMessageCount = useMemo(() => messages.filter(m => m.role === 'user').length, [messages]);

    // 목표 달성 체크
    useEffect(() => {
        if (userMessageCount === 10 && !hasTriggeredGoalRef.current) {
            onGoalAchieved?.();
            hasTriggeredGoalRef.current = true;
        }
    }, [userMessageCount, onGoalAchieved]);

    // SSE 스트리밍 설정
    const { stream, abort } = useSSEStreamV2({
        onChunk: (chunk) => {
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && !last.translation) { // 파싱 전인 경우만 스트리밍 합침
                    return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
                }
                return [...prev, { role: 'assistant', content: chunk }];
            });
        },
        onDone: () => handleDone(),
        onError: (err) => {
            setIsStreaming(false);
            onError?.(err || 'Streaming error occurred');
        },
    });

    // AI 응답 파싱 (JSON 추출)
    const handleDone = useCallback(() => {
        setIsStreaming(false);
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.content) {
                try {
                    const jsonBlocks = last.content.match(/\{[\s\S]*?\}/g);
                    if (jsonBlocks && jsonBlocks.length > 0) {
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
                    console.warn('[useAIChatLogic] JSON 파싱 실패:', e);
                }
            }
            return prev;
        });
    }, []);

    const sendToAI = useCallback(async (msgs: ChatMessage[]) => {
        setIsStreaming(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const systemMsg: ChatMessage = {
            role: 'system',
            content: systemPrompt
        };
        const messagesWithSystem = [systemMsg, ...msgs];
        await stream(chatEndpoint, { messages: messagesWithSystem, language });
    }, [stream, language, systemPrompt, chatEndpoint]);

    // 오디오 녹음 및 STT 처리
    const { state: recordingState, startRecording, stopRecording, cancelRecording, resetState } = useAudioRecorder({
        onAudioReady: async (blob) => {
            try {
                const formData = new FormData();
                formData.append('audio', blob, 'recording.webm');

                // STT 언어 결정 (한국어로 말하기 모드 배려)
                const sttLanguage = currentRecordingMode === 'ko' ? 'ko' : language;
                
                const res = await api.post(sttEndpoint, formData, {
                    params: { language: sttLanguage },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                let transcript: string = res.data?.data?.text || '';
                if (!transcript.trim()) {
                    resetState();
                    return;
                }

                // 한국어 포함 시 번역 수행 (영문 채팅 모드에서 한국어 입력 시)
                const containsKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(transcript.replace(/\s/g, ''));
                if ((currentRecordingMode === 'ko' || containsKorean) && language === 'en') {
                    try {
                        const transRes = await api.post(translateEndpoint, { 
                            text: transcript, 
                            target: 'en' 
                        });
                        if (transRes.data?.data) {
                            transcript = transRes.data.data;
                        }
                    } catch (e) {
                        console.error('[useAIChatLogic] 번역 실패:', e);
                    }
                }

                const userMsg: ChatMessage = { 
                    role: 'user', 
                    content: transcript,
                    audioUrl: URL.createObjectURL(blob)
                };
                
                const updatedMsgs = [...messages, userMsg];
                setMessages(updatedMsgs);
                resetState();
                await sendToAI(updatedMsgs);
            } catch (err) {
                console.error('[useAIChatLogic] STT/번역 실패:', err);
                resetState();
            }
        },
        onAnalyser: setAnalyser,
    });

    const handleStartRecording = (mode: string) => {
        setCurrentRecordingMode(mode);
        startRecording();
    };

    const handleEndChat = () => {
        abort();
        setMessages([]);
        conversationStartedRef.current = false;
        hasTriggeredGoalRef.current = false;
    };

    // 초기 환영 메시지
    useEffect(() => {
        if (welcomeMessage && !conversationStartedRef.current) {
            conversationStartedRef.current = true;
            setMessages([{ role: 'assistant', content: welcomeMessage }]);
        }
    }, [welcomeMessage]);

    return {
        messages,
        setMessages,
        isStreaming,
        recordingState,
        analyser,
        userMessageCount,
        handleStartRecording,
        stopRecording,
        cancelRecording,
        handleEndChat,
        sendToAI
    };
}
