package com.chek.media.api;

import com.chek.media.model.ResponseData;
import com.chek.media.model.media.GetMediaResponse;
import com.chek.media.service.UploadService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class MediaController {
  private final UploadService uploadService;

  public MediaController(UploadService uploadService) {
    this.uploadService = uploadService;
  }

  @GetMapping("/media/{id}")
  public ResponseData<GetMediaResponse> getMedia(@PathVariable("id") long mediaObjectId) {
    GetMediaResponse resp = uploadService.getMedia(mediaObjectId);
    if (resp == null) return ResponseData.error("NOT_FOUND", "media not found");
    return ResponseData.ok(resp);
  }
}

