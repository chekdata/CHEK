package com.chek.media.model.upload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PresignUploadRequest {
  @NotBlank
  @Size(max = 200)
  private String filename;

  @NotBlank
  @Size(max = 120)
  private String contentType;

  private Long sizeBytes;

  @Size(max = 32)
  private String purpose;

  public String getFilename() {
    return filename;
  }

  public void setFilename(String filename) {
    this.filename = filename;
  }

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String contentType) {
    this.contentType = contentType;
  }

  public Long getSizeBytes() {
    return sizeBytes;
  }

  public void setSizeBytes(Long sizeBytes) {
    this.sizeBytes = sizeBytes;
  }

  public String getPurpose() {
    return purpose;
  }

  public void setPurpose(String purpose) {
    this.purpose = purpose;
  }
}

