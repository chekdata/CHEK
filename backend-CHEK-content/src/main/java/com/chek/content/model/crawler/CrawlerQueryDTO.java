package com.chek.content.model.crawler;

public class CrawlerQueryDTO {
  private String platform;
  private String query;
  private Double meanReward;
  private Double alpha;
  private Double beta;

  public String getPlatform() {
    return platform;
  }

  public void setPlatform(String platform) {
    this.platform = platform;
  }

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  public Double getMeanReward() {
    return meanReward;
  }

  public void setMeanReward(Double meanReward) {
    this.meanReward = meanReward;
  }

  public Double getAlpha() {
    return alpha;
  }

  public void setAlpha(Double alpha) {
    this.alpha = alpha;
  }

  public Double getBeta() {
    return beta;
  }

  public void setBeta(Double beta) {
    this.beta = beta;
  }
}

