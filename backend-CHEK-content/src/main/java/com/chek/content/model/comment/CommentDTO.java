package com.chek.content.model.comment;

import java.time.Instant;

public class CommentDTO {
  private long commentId;
  private long postId;
  private String body;
  private String authorUserOneId;
  private Long parentCommentId;
  private Instant createdAt;

  public long getCommentId() {
    return commentId;
  }

  public void setCommentId(long commentId) {
    this.commentId = commentId;
  }

  public long getPostId() {
    return postId;
  }

  public void setPostId(long postId) {
    this.postId = postId;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public String getAuthorUserOneId() {
    return authorUserOneId;
  }

  public void setAuthorUserOneId(String authorUserOneId) {
    this.authorUserOneId = authorUserOneId;
  }

  public Long getParentCommentId() {
    return parentCommentId;
  }

  public void setParentCommentId(Long parentCommentId) {
    this.parentCommentId = parentCommentId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}

