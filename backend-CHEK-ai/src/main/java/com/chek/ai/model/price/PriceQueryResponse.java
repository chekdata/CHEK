package com.chek.ai.model.price;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;

public class PriceQueryResponse {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private long sessionId;
  private boolean uncertain;
  private String currency = "CNY";
  private Double priceMin;
  private Double priceMax;
  private String unit;
  private List<Citation> citations = new ArrayList<>();
  private List<String> tips = new ArrayList<>();
  private FallbackAction fallbackAction;

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

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public Double getPriceMin() {
    return priceMin;
  }

  public void setPriceMin(Double priceMin) {
    this.priceMin = priceMin;
  }

  public Double getPriceMax() {
    return priceMax;
  }

  public void setPriceMax(Double priceMax) {
    this.priceMax = priceMax;
  }

  public String getUnit() {
    return unit;
  }

  public void setUnit(String unit) {
    this.unit = unit;
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

  public FallbackAction getFallbackAction() {
    return fallbackAction;
  }

  public void setFallbackAction(FallbackAction fallbackAction) {
    this.fallbackAction = fallbackAction;
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
    private String snippet;
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

    public String getSnippet() {
      return snippet;
    }

    public void setSnippet(String snippet) {
      this.snippet = snippet;
    }

    public String getSourceId() {
      return sourceId;
    }

    public void setSourceId(String sourceId) {
      this.sourceId = sourceId;
    }
  }

  public static class FallbackAction {
    private String type;
    private String postType;
    private String draftJson;

    public String getType() {
      return type;
    }

    public void setType(String type) {
      this.type = type;
    }

    public String getPostType() {
      return postType;
    }

    public void setPostType(String postType) {
      this.postType = postType;
    }

    public String getDraftJson() {
      return draftJson;
    }

    public void setDraftJson(String draftJson) {
      this.draftJson = draftJson;
    }
  }
}

