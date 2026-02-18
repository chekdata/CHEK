package com.chek.ai.model.price;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PriceQueryRequest {
  @NotBlank
  @Size(max = 200)
  private String query;

  @Size(max = 200)
  private String location;

  @Size(max = 64)
  private String time;

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getTime() {
    return time;
  }

  public void setTime(String time) {
    this.time = time;
  }
}

