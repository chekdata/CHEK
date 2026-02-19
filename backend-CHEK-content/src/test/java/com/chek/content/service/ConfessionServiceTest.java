package com.chek.content.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.chek.content.model.confession.ConfessionPayload;
import org.junit.jupiter.api.Test;

class ConfessionServiceTest {
  private final ConfessionService service = new ConfessionService();

  @Test
  void composeDefaultsToWarmModeWhenInputMissing() {
    ConfessionPayload payload = service.compose(null, "   ", null);

    assertEquals("胶己人", payload.to());
    assertEquals("CHEK 志愿者", payload.from());
    assertEquals("warm", payload.mode());
    assertTrue(payload.message().contains("来了就是胶己人"));
    assertEquals(3, payload.actionItems().size());
  }

  @Test
  void composeSupportsApologyMode() {
    ConfessionPayload payload = service.compose("游客朋友", "潮客CHEK", "apology");

    assertEquals("游客朋友", payload.to());
    assertEquals("潮客CHEK", payload.from());
    assertEquals("apology", payload.mode());
    assertTrue(payload.message().contains("真诚抱歉"));
    assertEquals("先道歉", payload.actionItems().get(0));
  }

  @Test
  void composeSupportsActionModeWithSocialPlatforms() {
    ConfessionPayload payload = service.compose("胶己人", "CHEK团队", "ACTION");

    assertEquals("action", payload.mode());
    assertTrue(payload.message().contains("小红书"));
    assertTrue(payload.message().contains("微博"));
    assertTrue(payload.message().contains("抖音"));
    assertEquals(3, payload.actionItems().size());
  }

  @Test
  void composeFallsBackToWarmWhenModeUnknown() {
    ConfessionPayload payload = service.compose("潮汕", "CHEK", "unsupported-mode");

    assertEquals("warm", payload.mode());
    assertTrue(payload.message().contains("口碑守住"));
  }

  @Test
  void composeTrimsAndClampsNames() {
    ConfessionPayload payload =
        service.compose(
            "  这是一段非常非常非常长的称呼用于测试截断行为  ",
            "  CHEK    共建   小队   ",
            "warm");

    assertEquals("这是一段非常非常非常长的称呼用于测试截断行为", payload.to());
    assertEquals("CHEK 共建 小队", payload.from());
    assertTrue(payload.to().length() <= 24);
  }
}
