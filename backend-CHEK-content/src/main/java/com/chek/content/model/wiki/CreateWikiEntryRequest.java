package com.chek.content.model.wiki;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateWikiEntryRequest {
  @NotBlank
  @Size(max = 120)
  private String title;

  @NotBlank
  @Size(max = 32)
  private String entryType;

  @Size(max = 500)
  private String summary;

  // JSON string; keep it flexible for MVP
  private String contentStructJson;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getEntryType() {
    return entryType;
  }

  public void setEntryType(String entryType) {
    this.entryType = entryType;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getContentStructJson() {
    return contentStructJson;
  }

  public void setContentStructJson(String contentStructJson) {
    this.contentStructJson = contentStructJson;
  }
}

