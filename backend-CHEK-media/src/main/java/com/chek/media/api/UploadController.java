package com.chek.media.api;

import com.chek.media.model.ResponseData;
import com.chek.media.model.upload.PresignUploadRequest;
import com.chek.media.model.upload.PresignUploadResponse;
import com.chek.media.service.UploadService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class UploadController {
  private final UploadService uploadService;

  public UploadController(UploadService uploadService) {
    this.uploadService = uploadService;
  }

  @PostMapping("/uploads:presign")
  public ResponseData<PresignUploadResponse> presign(
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @Valid @RequestBody PresignUploadRequest req) {
    return ResponseData.ok(uploadService.presign(userOneId, req));
  }
}

