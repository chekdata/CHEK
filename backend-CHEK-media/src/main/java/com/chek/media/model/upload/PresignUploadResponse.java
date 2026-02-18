package com.chek.media.model.upload;

public class PresignUploadResponse {
  private long mediaObjectId;
  private String objectKey;
  private String putUrl;
  private boolean mock;

  public long getMediaObjectId() {
    return mediaObjectId;
  }

  public void setMediaObjectId(long mediaObjectId) {
    this.mediaObjectId = mediaObjectId;
  }

  public String getObjectKey() {
    return objectKey;
  }

  public void setObjectKey(String objectKey) {
    this.objectKey = objectKey;
  }

  public String getPutUrl() {
    return putUrl;
  }

  public void setPutUrl(String putUrl) {
    this.putUrl = putUrl;
  }

  public boolean isMock() {
    return mock;
  }

  public void setMock(boolean mock) {
    this.mock = mock;
  }
}

