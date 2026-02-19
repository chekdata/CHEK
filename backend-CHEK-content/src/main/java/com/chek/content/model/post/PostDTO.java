package com.chek.content.model.post;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

public class PostDTO {
  private long postId;
  private String title;
  private String body;
  private List<String> tags;
  private String locationName;
  private Double lng;
  private Double lat;
  private Instant occurredAt;
  private List<PostMediaDTO> media;
  private String authorUserOneId;
  private boolean isPublic;
  private boolean isIndexable;
  private long commentCount;
  private long likeCount;
  private long favoriteCount;
  private boolean likedByMe;
  private boolean favoritedByMe;
  private Instant createdAt;
  private Instant updatedAt;

  public long getPostId() {
    return postId;
  }

  public void setPostId(long postId) {
    this.postId = postId;
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

  public List<PostMediaDTO> getMedia() {
    return media;
  }

  public void setMedia(List<PostMediaDTO> media) {
    this.media = media;
  }

  public String getAuthorUserOneId() {
    return authorUserOneId;
  }

  public void setAuthorUserOneId(String authorUserOneId) {
    this.authorUserOneId = authorUserOneId;
  }

  @JsonProperty("isPublic")
  public boolean isPublic() {
    return isPublic;
  }

  @JsonProperty("isPublic")
  public void setPublic(boolean aPublic) {
    isPublic = aPublic;
  }

  @JsonProperty("isIndexable")
  public boolean isIndexable() {
    return isIndexable;
  }

  @JsonProperty("isIndexable")
  public void setIndexable(boolean indexable) {
    isIndexable = indexable;
  }

  public long getCommentCount() {
    return commentCount;
  }

  public void setCommentCount(long commentCount) {
    this.commentCount = commentCount;
  }

  public long getLikeCount() {
    return likeCount;
  }

  public void setLikeCount(long likeCount) {
    this.likeCount = likeCount;
  }

  public long getFavoriteCount() {
    return favoriteCount;
  }

  public void setFavoriteCount(long favoriteCount) {
    this.favoriteCount = favoriteCount;
  }

  public boolean isLikedByMe() {
    return likedByMe;
  }

  public void setLikedByMe(boolean likedByMe) {
    this.likedByMe = likedByMe;
  }

  public boolean isFavoritedByMe() {
    return favoritedByMe;
  }

  public void setFavoritedByMe(boolean favoritedByMe) {
    this.favoritedByMe = favoritedByMe;
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
