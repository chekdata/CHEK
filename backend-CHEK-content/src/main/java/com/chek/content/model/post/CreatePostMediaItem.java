package com.chek.content.model.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class CreatePostMediaItem {
  @NotNull @Positive private Long mediaObjectId;

  @NotBlank
  @Size(max = 16)
  private String kind;

  public Long getMediaObjectId() {
    return mediaObjectId;
  }

  public void setMediaObjectId(Long mediaObjectId) {
    this.mediaObjectId = mediaObjectId;
  }

  public String getKind() {
    return kind;
  }

  public void setKind(String kind) {
    this.kind = kind;
  }
}

