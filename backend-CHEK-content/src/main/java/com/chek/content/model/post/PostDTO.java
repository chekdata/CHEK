package com.chek.content.model.post;

public class PostDTO {
  private long id;
  private String type;
  private String status;
  private String title;
  private String body;
  private String extJson;
  private String authorUserOneId;
  private String createdAt;

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
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

  public String getExtJson() {
    return extJson;
  }

  public void setExtJson(String extJson) {
    this.extJson = extJson;
  }

  public String getAuthorUserOneId() {
    return authorUserOneId;
  }

  public void setAuthorUserOneId(String authorUserOneId) {
    this.authorUserOneId = authorUserOneId;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }
}

