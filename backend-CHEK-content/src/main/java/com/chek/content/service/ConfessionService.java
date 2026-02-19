package com.chek.content.service;

import com.chek.content.model.confession.ConfessionPayload;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ConfessionService {
  private static final int MAX_NAME_LEN = 24;
  private static final String DEFAULT_TO = "胶己人";
  private static final String DEFAULT_FROM = "CHEK 志愿者";

  public ConfessionPayload compose(String toRaw, String fromRaw, String modeRaw) {
    String to = normalizeName(toRaw, DEFAULT_TO);
    String from = normalizeName(fromRaw, DEFAULT_FROM);
    Mode mode = Mode.from(modeRaw);

    List<String> lines =
        switch (mode) {
          case WARM ->
              List.of(
                  "你我都在守这片海边的体面。",
                  "慢慢做，不求一时热闹，只求长期安心。",
                  "来了就是胶己人，我们一起把口碑守住。");
          case APOLOGY ->
              List.of(
                  "如果哪里没照顾到位，先说声真诚抱歉。",
                  "谢谢你愿意把问题讲出来，让我们有机会改进。",
                  "潮汕的体面，靠我们把每个细节补上。");
          case ACTION ->
              List.of(
                  "把善意落实为行动：",
                  "去小红书答疑，去微博澄清，去抖音评论区给真实建议。",
                  "线上线下都多走一步，让游客感到宾至如归。");
        };

    List<String> actionItems =
        switch (mode) {
          case ACTION ->
              List.of(
                  "小红书：回答游客路线/价格/礼仪问题",
                  "微博：发现谣言与误导时补充真实信息",
                  "抖音：在评论区提供可执行建议与避坑提醒");
          case APOLOGY ->
              List.of("先道歉", "再说明", "最后给出解决路径");
          case WARM -> List.of("礼貌回应", "真诚欢迎", "持续共建");
        };

    String message = String.join("\n", lines);
    return new ConfessionPayload(to, from, mode.value(), message, actionItems);
  }

  private String normalizeName(String raw, String defaultValue) {
    if (raw == null) return defaultValue;
    String cleaned = raw.trim().replaceAll("\\s+", " ");
    if (cleaned.isBlank()) return defaultValue;
    if (cleaned.length() <= MAX_NAME_LEN) return cleaned;
    return cleaned.substring(0, MAX_NAME_LEN);
  }

  enum Mode {
    WARM("warm"),
    APOLOGY("apology"),
    ACTION("action");

    private final String value;

    Mode(String value) {
      this.value = value;
    }

    public String value() {
      return value;
    }

    static Mode from(String raw) {
      if (raw == null) return WARM;
      String normalized = raw.trim().toLowerCase();
      if (normalized.equals(APOLOGY.value)) return APOLOGY;
      if (normalized.equals(ACTION.value)) return ACTION;
      return WARM;
    }
  }
}
