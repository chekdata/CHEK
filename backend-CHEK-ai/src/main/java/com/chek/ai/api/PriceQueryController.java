package com.chek.ai.api;

import com.chek.ai.model.ResponseData;
import com.chek.ai.model.price.PriceQueryRequest;
import com.chek.ai.model.price.PriceQueryResponse;
import com.chek.ai.repo.AiRepository;
import com.chek.ai.service.PriceQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class PriceQueryController {
  private final PriceQueryService priceQueryService;
  private final AiRepository aiRepository;

  public PriceQueryController(PriceQueryService priceQueryService, AiRepository aiRepository) {
    this.priceQueryService = priceQueryService;
    this.aiRepository = aiRepository;
  }

  @PostMapping("/priceQuery")
  public ResponseData<PriceQueryResponse> priceQuery(
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @Valid @RequestBody PriceQueryRequest req) {
    long sessionId = aiRepository.createSession(userOneId);
    aiRepository.addMessage(sessionId, "user", req.getQuery());
    PriceQueryResponse resp = priceQueryService.query(req);
    aiRepository.addMessage(sessionId, "assistant", resp.toJson());
    resp.setSessionId(sessionId);
    return ResponseData.ok(resp);
  }
}

