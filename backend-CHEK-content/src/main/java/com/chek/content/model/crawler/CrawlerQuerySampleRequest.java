package com.chek.content.model.crawler;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CrawlerQuerySampleRequest {
  @NotBlank
  @Size(max = 32)
  private String platform;

  @Min(1)
  @Max(200)
  private Integer limit;

  public String getPlatform() {
    return platform;
  }

  public void setPlatform(String platform) {
    this.platform = platform;
  }

  public Integer getLimit() {
    return limit;
  }

  public void setLimit(Integer limit) {
    this.limit = limit;
  }
}
