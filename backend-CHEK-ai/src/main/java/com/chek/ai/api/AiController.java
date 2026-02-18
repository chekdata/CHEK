package com.chek.ai.api;

import com.chek.ai.model.ResponseData;
import com.chek.ai.model.ai.AiAskRequest;
import com.chek.ai.model.ai.AiAskResponse;
import com.chek.ai.repo.AiRepository;
import com.chek.ai.service.AiAskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class AiController {
  private final AiAskService aiAskService;
  private final AiRepository aiRepository;

  public AiController(AiAskService aiAskService, AiRepository aiRepository) {
    this.aiAskService = aiAskService;
    this.aiRepository = aiRepository;
  }

  @PostMapping("/ai/ask")
  public ResponseData<AiAskResponse> ask(
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @Valid @RequestBody AiAskRequest req) {
    long sessionId = aiRepository.createSession(userOneId);
    aiRepository.addMessage(sessionId, "user", req.getQuery());

    AiAskResponse resp = aiAskService.ask(req);
    resp.setSessionId(sessionId);
    aiRepository.addMessage(sessionId, "assistant", resp.toJson());
    return ResponseData.ok(resp);
  }
}

