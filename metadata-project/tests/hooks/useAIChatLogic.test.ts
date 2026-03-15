import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAIChatLogic } from '@/lib/hooks/useAIChatLogic';
import { useSSEStreamV2 } from '@/lib/hooks/useSSEStreamV2';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import api from '@/services/axios';

// Mock dependencies
jest.mock('@/lib/hooks/useSSEStreamV2');
jest.mock('@/lib/hooks/useAudioRecorder');
jest.mock('@/services/axios');

describe('useAIChatLogic Hook', () => {
    const mockStream = jest.fn();
    const mockAbort = jest.fn();
    const mockStartRecording = jest.fn();
    const mockStopRecording = jest.fn();
    const mockCancelRecording = jest.fn();
    const mockResetState = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        
        (useSSEStreamV2 as jest.Mock).mockReturnValue({
            stream: mockStream,
            abort: mockAbort,
        });

        (useAudioRecorder as jest.Mock).mockReturnValue({
            state: 'idle',
            startRecording: mockStartRecording,
            stopRecording: mockStopRecording,
            cancelRecording: mockCancelRecording,
            resetState: mockResetState,
        });
    });

    it('should initialize with welcome message', () => {
        const { result } = renderHook(() => useAIChatLogic({
            language: 'en',
            systemPrompt: 'Test prompt',
            welcomeMessage: 'Hello traveler'
        }));

        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Hello traveler');
    });

    it('should calculate userMessageCount correctly', async () => {
        const { result } = renderHook(() => useAIChatLogic({
            language: 'en',
            systemPrompt: 'Test prompt'
        }));

        act(() => {
            result.current.setMessages([
                { role: 'assistant', content: 'Hi' },
                { role: 'user', content: 'Hello' },
                { role: 'user', content: 'How are you?' }
            ]);
        });

        expect(result.current.userMessageCount).toBe(2);
    });

    it('should trigger onGoalAchieved on 10th user message', () => {
        const onGoalAchieved = jest.fn();
        const { result } = renderHook(() => useAIChatLogic({
            language: 'en',
            systemPrompt: 'Test prompt',
            onGoalAchieved
        }));

        act(() => {
            const messages = Array(10).fill({ role: 'user', content: 'test' });
            result.current.setMessages(messages);
        });

        expect(onGoalAchieved).toHaveBeenCalled();
    });

    it('should start recording with correct mode', () => {
        const { result } = renderHook(() => useAIChatLogic({
            language: 'en',
            systemPrompt: 'Test prompt'
        }));

        act(() => {
            result.current.handleStartRecording('ko');
        });

        expect(mockStartRecording).toHaveBeenCalled();
    });
});
