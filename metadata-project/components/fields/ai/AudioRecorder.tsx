'use client';

import React from 'react';
import { RecordingState } from '@/lib/types/ai';
import Waveform from './Waveform';

interface AudioRecorderProps {
    state: RecordingState;
    analyser: AnalyserNode | null;
    micBtnLabel: string;
    submitBtnLabel: string;
    onStart: (mode: 'en' | 'ko') => void;
    onStop: () => void;
    onCancel?: () => void;
    disabled?: boolean;
    className?: string;
    micClassName?: string;
}

export default function AudioRecorder({
    state, analyser, micBtnLabel, submitBtnLabel,
    onStart, onStop, onCancel, disabled,
    className, micClassName,
}: AudioRecorderProps) {
    const isRecording = state === 'recording';
    const isProcessing = state === 'processing';

    // Professional SVG Icons
    const MicIcon = ({ color = "#3F51B5" }: { color?: string }) => (
        <svg viewBox="0 0 24 24" fill={color} style={{ width: '40px', height: '40px', display: 'block' }}>
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
    );

    const StopIcon = () => (
        <svg viewBox="0 0 24 24" fill="white" style={{ width: '32px', height: '32px', display: 'block' }}>
            <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
    );

    return (
        <div 
            className={`audio-recorder-bar premium-glass ${className || ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '40px 20px', background: '#fff' }}
        >
            {!isRecording && !isProcessing && (
                <div className="flex flex-col items-center">
                    <p 
                        className="mic-instruction font-bold"
                        style={{ fontSize: '1.2rem', color: '#7F8C8D', marginBottom: '32px', textAlign: 'center' }}
                    >
                        모드를 선택하여 대화를 시작하세요.
                    </p>
                    
                    <div className="flex gap-12 items-center mb-6">
                        {/* English/General Mode Button */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                className={`mic-btn ${micClassName || ''}`}
                                onClick={() => onStart('en')}
                                disabled={disabled || isProcessing}
                                style={{ background: '#E8EAF6', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(63, 81, 181, 0.1)' }}
                                title="English Mode (Phonetic)"
                            >
                                <MicIcon />
                            </button>
                            <span className="text-[#3F51B5] font-bold text-sm">General Mic</span>
                        </div>

                        {/* Korean Mode Button */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                className={`mic-btn ko-mic-btn ${micClassName || ''}`}
                                onClick={() => onStart('ko')}
                                disabled={disabled || isProcessing}
                                style={{ background: '#E8EAF6', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(63, 81, 181, 0.1)' }}
                                title="Speak in Korean (Translation)"
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl mb-1">🇰🇷</span>
                                    <span className="text-[10px] font-black text-[#303F9F]">KOREAN</span>
                                </div>
                            </button>
                            <span className="text-[#303F9F] font-bold text-sm">한국어로 말하기</span>
                        </div>
                    </div>
                </div>
            )}

            {isRecording && (
                <div className="flex flex-col items-center w-full">
                    <button
                        className={`mic-btn mic-btn--active ${micClassName || ''}`}
                        onClick={onStop}
                        disabled={disabled || isProcessing}
                        style={{ background: '#FF5252', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(255, 82, 82, 0.4)' }}
                    >
                        <StopIcon />
                    </button>
                    
                    <Waveform analyser={analyser} isActive={isRecording} />

                    <div className="recorder-actions flex gap-4 w-full mt-8 px-4" style={{ maxWidth: '400px' }}>
                        <button 
                            className="cancel-btn flex-1" 
                            onClick={onCancel}
                            style={{ background: '#fff', border: '1.5px solid #E0E4E8', color: '#7F8C8D', padding: '14px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                            취소
                        </button>
                        <button 
                            className="finish-btn flex-2" 
                            onClick={onStop}
                            style={{ background: '#fff', border: '1.5px solid #3F51B5', color: '#3F51B5', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            답변 완료
                        </button>
                    </div>
                </div>
            )}

            {isProcessing && (
                <div className="processing-indicator flex flex-col items-center gap-4 mt-4 text-[#3F51B5] font-bold">
                    <div className="loading-spinner-small" style={{ width: '40px', height: '40px' }} />
                    <span className="text-lg">AI가 답변을 생각하고 있어요...</span>
                </div>
            )}
        </div>
    );
}
