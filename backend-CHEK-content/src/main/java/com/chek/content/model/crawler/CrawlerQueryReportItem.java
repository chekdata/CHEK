package com.chek.content.model.crawler;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CrawlerQueryReportItem {
  @NotBlank
  @Size(max = 200)
  private String query;

  // Reward in [0, 1]. Higher means better yield/precision.
  @NotNull
  @DecimalMin("0.0")
  @DecimalMax("1.0")
  private Double reward;

  // Trials is a weight for updating bandit parameters (e.g. number of evaluated items).
  @NotNull
  @Min(1)
  @Max(10000)
  private Integer trials;

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  public Double getReward() {
    return reward;
  }

  public void setReward(Double reward) {
    this.reward = reward;
  }

  public Integer getTrials() {
    return trials;
  }

  public void setTrials(Integer trials) {
    this.trials = trials;
  }
}

