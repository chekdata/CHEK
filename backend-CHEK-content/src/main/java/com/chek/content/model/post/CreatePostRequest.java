package com.chek.content.model.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreatePostRequest {
  @NotBlank
  @Size(max = 32)
  private String type;

  @Size(max = 120)
  private String title;

  @Size(max = 4000)
  private String body;

  // JSON string; keep it flexible for MVP
  private String extJson;

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public String getExtJson() {
    return extJson;
  }

  public void setExtJson(String extJson) {
    this.extJson = extJson;
  }
}

