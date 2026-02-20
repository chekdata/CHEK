package com.chek.content.model.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public class IngestExternalPostRequest {
  @NotBlank
  @Size(max = 32)
  private String sourcePlatform;

  @NotBlank
  @Size(max = 128)
  private String sourceId;

  @NotBlank
  @Size(max = 500)
  private String sourceUrl;

  @Size(max = 120)
  private String title;

  @NotBlank
  @Size(max = 4000)
  private String body;

  private List<@NotBlank @Size(max = 64) String> tags;

  @Size(max = 120)
  private String locationName;

  private Double lng;

  private Double lat;

  private Instant occurredAt;

  @Size(max = 64)
  private String authorUserOneId;

  public String getSourcePlatform() {
    return sourcePlatform;
  }

  public void setSourcePlatform(String sourcePlatform) {
    this.sourcePlatform = sourcePlatform;
  }

  public String getSourceId() {
    return sourceId;
  }

  public void setSourceId(String sourceId) {
    this.sourceId = sourceId;
  }

  public String getSourceUrl() {
    return sourceUrl;
  }

  public void setSourceUrl(String sourceUrl) {
    this.sourceUrl = sourceUrl;
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

  public List<String> getTags() {
    return tags;
  }

  public void setTags(List<String> tags) {
    this.tags = tags;
  }

  public String getLocationName() {
    return locationName;
  }

  public void setLocationName(String locationName) {
    this.locationName = locationName;
  }

  public Double getLng() {
    return lng;
  }

  public void setLng(Double lng) {
    this.lng = lng;
  }

  public Double getLat() {
    return lat;
  }

  public void setLat(Double lat) {
    this.lat = lat;
  }

  public Instant getOccurredAt() {
    return occurredAt;
  }

  public void setOccurredAt(Instant occurredAt) {
    this.occurredAt = occurredAt;
  }

  public String getAuthorUserOneId() {
    return authorUserOneId;
  }

  public void setAuthorUserOneId(String authorUserOneId) {
    this.authorUserOneId = authorUserOneId;
  }
}

