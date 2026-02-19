package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.confession.ConfessionPayload;
import com.chek.content.service.ConfessionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class ConfessionController {
  private final ConfessionService confessionService;

  public ConfessionController(ConfessionService confessionService) {
    this.confessionService = confessionService;
  }

  @GetMapping("/confession")
  public ResponseData<ConfessionPayload> confession(
      @RequestParam(name = "to", required = false) String to,
      @RequestParam(name = "from", required = false) String from,
      @RequestParam(name = "mode", required = false) String mode) {
    return ResponseData.ok(confessionService.compose(to, from, mode));
  }
}
