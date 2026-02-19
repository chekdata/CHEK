package com.chek.content.model.social;

public class FollowStatusDTO {
  private String userOneId;
  private boolean following;
  private long followerCount;

  public String getUserOneId() {
    return userOneId;
  }

  public void setUserOneId(String userOneId) {
    this.userOneId = userOneId;
  }

  public boolean isFollowing() {
    return following;
  }

  public void setFollowing(boolean following) {
    this.following = following;
  }

  public long getFollowerCount() {
    return followerCount;
  }

  public void setFollowerCount(long followerCount) {
    this.followerCount = followerCount;
  }
}

