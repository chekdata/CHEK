package com.chek.ai.model.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;

public class AiAskResponse {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private long sessionId;
  private boolean uncertain;
  private String answer;
  private List<Citation> citations = new ArrayList<>();
  private List<String> tips = new ArrayList<>();
  private Object ui;

  public long getSessionId() {
    return sessionId;
  }

  public void setSessionId(long sessionId) {
    this.sessionId = sessionId;
  }

  public boolean isUncertain() {
    return uncertain;
  }

  public void setUncertain(boolean uncertain) {
    this.uncertain = uncertain;
  }

  public String getAnswer() {
    return answer;
  }

  public void setAnswer(String answer) {
    this.answer = answer;
  }

  public List<Citation> getCitations() {
    return citations;
  }

  public void setCitations(List<Citation> citations) {
    this.citations = citations;
  }

  public List<String> getTips() {
    return tips;
  }

  public void setTips(List<String> tips) {
    this.tips = tips;
  }

  public Object getUi() {
    return ui;
  }

  public void setUi(Object ui) {
    this.ui = ui;
  }

  public String toJson() {
    try {
      return MAPPER.writeValueAsString(this);
    } catch (JsonProcessingException e) {
      return "{\"error\":\"SERIALIZE_FAILED\"}";
    }
  }

  public static class Citation {
    private String sourceType;
    private String title;
    private String url;
    private String sourceId;

    public String getSourceType() {
      return sourceType;
    }

    public void setSourceType(String sourceType) {
      this.sourceType = sourceType;
    }

    public String getTitle() {
      return title;
    }

    public void setTitle(String title) {
      this.title = title;
    }

    public String getUrl() {
      return url;
    }

    public void setUrl(String url) {
      this.url = url;
    }

    public String getSourceId() {
      return sourceId;
    }

    public void setSourceId(String sourceId) {
      this.sourceId = sourceId;
    }
  }
}

