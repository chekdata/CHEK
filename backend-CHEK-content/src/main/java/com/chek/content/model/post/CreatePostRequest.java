package com.chek.content.model.post;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public class CreatePostRequest {
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

  private List<@Valid CreatePostMediaItem> media;

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

  public List<CreatePostMediaItem> getMedia() {
    return media;
  }

  public void setMedia(List<CreatePostMediaItem> media) {
    this.media = media;
  }
}
