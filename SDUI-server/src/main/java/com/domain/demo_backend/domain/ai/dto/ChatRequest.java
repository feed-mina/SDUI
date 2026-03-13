package com.domain.demo_backend.domain.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ChatRequest {
    private List<ChatMessage> messages;
    private String language;  // "en" | "ko"
}
