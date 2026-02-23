package com.chek.content.model.crawler;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CrawlerQueryReportRequest {
  @NotBlank
  @Size(max = 32)
  private String platform;

  @NotEmpty
  private List<@Valid CrawlerQueryReportItem> items;

  public String getPlatform() {
    return platform;
  }

  public void setPlatform(String platform) {
    this.platform = platform;
  }

  public List<CrawlerQueryReportItem> getItems() {
    return items;
  }

  public void setItems(List<CrawlerQueryReportItem> items) {
    this.items = items;
  }
}

