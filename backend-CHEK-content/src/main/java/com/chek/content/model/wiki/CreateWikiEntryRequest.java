package com.chek.content.model.wiki;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CreateWikiEntryRequest {
  @NotBlank
  @Size(max = 160)
  private String slug;

  @NotBlank
  @Size(max = 120)
  private String title;

  @Size(max = 500)
  private String summary;

  @NotBlank
  private String body;

  private List<@NotBlank @Size(max = 64) String> tags;

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public List<String> getTags() {
    return tags;
  }

  public void setTags(List<String> tags) {
    this.tags = tags;
  }
}
