package com.chek.media.model.media;

import java.time.Instant;

public class MediaObjectDTO {
  private long mediaObjectId;
  private String bucket;
  private String objectKey;
  private String contentType;
  private Long sizeBytes;
  private String uploaderUserOneId;
  private String status;
  private Instant createdAt;
  private Instant updatedAt;

  public long getMediaObjectId() {
    return mediaObjectId;
  }

  public void setMediaObjectId(long mediaObjectId) {
    this.mediaObjectId = mediaObjectId;
  }

  public String getBucket() {
    return bucket;
  }

  public void setBucket(String bucket) {
    this.bucket = bucket;
  }

  public String getObjectKey() {
    return objectKey;
  }

  public void setObjectKey(String objectKey) {
    this.objectKey = objectKey;
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

  public String getUploaderUserOneId() {
    return uploaderUserOneId;
  }

  public void setUploaderUserOneId(String uploaderUserOneId) {
    this.uploaderUserOneId = uploaderUserOneId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}

