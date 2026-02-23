package com.chek.content.model.crawler;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CrawlerQueryUpsertRequest {
  @NotBlank
  @Size(max = 32)
  private String platform;

  @NotEmpty
  private List<@NotBlank @Size(max = 200) String> queries;

  public String getPlatform() {
    return platform;
  }

  public void setPlatform(String platform) {
    this.platform = platform;
  }

  public List<String> getQueries() {
    return queries;
  }

  public void setQueries(List<String> queries) {
    this.queries = queries;
  }
}

