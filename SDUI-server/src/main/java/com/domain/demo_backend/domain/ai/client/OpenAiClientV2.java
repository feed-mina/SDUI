// V2 — 테스트용 복사본 (OpenAiClient.java 기반)
// 수정사항: language=null 이면 파라미터 미전송 (Whisper 자동 감지)
package com.domain.demo_backend.domain.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Slf4j
@Component
public class OpenAiClientV2 {

    private static final String OPENAI_BASE_URL = "https://api.openai.com/v1";

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model:gpt-4o}")
    private String model;

    @Value("${openai.whisper-model:whisper-1}")
    private String whisperModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * STT V2: language=null이면 파라미터 전송 안 함 → Whisper 자동 감지
     */
    @SuppressWarnings("unchecked")
    public String transcribe(MultipartFile audio, String language) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("Authorization", "Bearer " + apiKey);

        byte[] audioBytes = audio.getBytes();
        String originalFilename = audio.getOriginalFilename() != null
                ? audio.getOriginalFilename() : "audio.webm";

        ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() { return originalFilename; }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", audioResource);
        body.add("model", whisperModel);
        // ✅ V2 핵심 수정: null이면 language 파라미터 자체를 전송 안 함
        if (language != null && !language.isBlank()) {
            body.add("language", language);
            log.debug("[V2] STT language 강제 설정: {}", language);
        } else {
            log.debug("[V2] STT language 미설정 → Whisper 자동 감지");
        }

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                OPENAI_BASE_URL + "/audio/transcriptions", request, Map.class
        );

        if (response.getBody() == null || response.getBody().get("text") == null) {
            throw new IllegalStateException("Whisper API 응답이 비어 있습니다.");
        }
        return response.getBody().get("text").toString();
    }

    /**
     * Chat Completions SSE 스트리밍 V2
     * ✅ V2 추가 로깅: 청크 수신 확인용
     */
    public void streamChat(
            List<Map<String, String>> messages,
            Consumer<String> onChunk,
            Runnable onComplete) throws Exception {

        String jsonBody = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "messages", messages,
                "stream", true
        ));

        log.info("[V2] Chat 스트리밍 시작, model={}, messages={}", model, messages.size());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENAI_BASE_URL + "/chat/completions"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<InputStream> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofInputStream()
        );

        if (response.statusCode() != 200) {
            String errorBody = new String(response.body().readAllBytes());
            throw new IllegalStateException("OpenAI API 오류: HTTP " + response.statusCode() + " - " + errorBody);
        }

        int chunkCount = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data: ") && !line.equals("data: [DONE]")) {
                    String json = line.substring(6).trim();
                    try {
                        String chunk = extractChunkContent(json);
                        if (chunk != null && !chunk.isEmpty()) {
                            onChunk.accept(chunk);
                            chunkCount++;
                        }
                    } catch (Exception e) {
                        log.warn("[V2] SSE 청크 파싱 실패 (무시): {}", json);
                    }
                }
            }
        }
        log.info("[V2] Chat 스트리밍 완료, 총 {}개 청크 전송", chunkCount);
        onComplete.run();
    }

    /**
     * TTS V2: OpenAI TTS API 호출
     * model: tts-1, voice: alloy/nova 등 선택 가능
     */
    public byte[] generateSpeech(String text, String voice) throws Exception {
        Map<String, Object> body = Map.of(
                "model", "tts-1",
                "input", text,
                "voice", (voice != null && !voice.isBlank()) ? voice : "alloy"
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENAI_BASE_URL + "/audio/speech"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        log.info("[V2] TTS 요청 시작: {}자", text.length());
        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

        if (response.statusCode() != 200) {
            String errorMsg = new String(response.body());
            throw new IllegalStateException("OpenAI TTS 오류: " + errorMsg);
        }

        return response.body();
    }

    @SuppressWarnings("unchecked")
    private String extractChunkContent(String json) throws Exception {
        Map<String, Object> data = objectMapper.readValue(json, Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) data.get("choices");
        if (choices == null || choices.isEmpty()) return null;

        Map<String, Object> delta = (Map<String, Object>) choices.get(0).get("delta");
        if (delta == null) return null;

        Object content = delta.get("content");
        return content != null ? content.toString() : null;
    }
}
