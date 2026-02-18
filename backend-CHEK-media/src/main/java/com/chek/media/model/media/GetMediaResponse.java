package com.chek.media.model.media;

public class GetMediaResponse {
  private long mediaObjectId;
  private String bucket;
  private String objectKey;
  private String contentType;
  private Long sizeBytes;
  private String getUrl;
  private boolean mock;

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

  public String getGetUrl() {
    return getUrl;
  }

  public void setGetUrl(String getUrl) {
    this.getUrl = getUrl;
  }

  public boolean isMock() {
    return mock;
  }

  public void setMock(boolean mock) {
    this.mock = mock;
  }
}

