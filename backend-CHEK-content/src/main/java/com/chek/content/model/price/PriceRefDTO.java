package com.chek.content.model.price;

public class PriceRefDTO {
  private long id;
  private String category;
  private String subject;
  private Double priceMin;
  private Double priceMax;
  private String unit;
  private String currency;
  private String sourceType;
  private Long sourceId;

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public Double getPriceMin() {
    return priceMin;
  }

  public void setPriceMin(Double priceMin) {
    this.priceMin = priceMin;
  }

  public Double getPriceMax() {
    return priceMax;
  }

  public void setPriceMax(Double priceMax) {
    this.priceMax = priceMax;
  }

  public String getUnit() {
    return unit;
  }

  public void setUnit(String unit) {
    this.unit = unit;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public String getSourceType() {
    return sourceType;
  }

  public void setSourceType(String sourceType) {
    this.sourceType = sourceType;
  }

  public Long getSourceId() {
    return sourceId;
  }

  public void setSourceId(Long sourceId) {
    this.sourceId = sourceId;
  }
}

