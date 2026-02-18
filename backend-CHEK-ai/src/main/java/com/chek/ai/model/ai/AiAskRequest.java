package com.chek.ai.model.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AiAskRequest {
  @NotBlank
  @Size(max = 400)
  private String query;

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }
}

