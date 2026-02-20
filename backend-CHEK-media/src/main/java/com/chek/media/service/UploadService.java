package com.chek.media.service;

import com.chek.media.model.media.GetMediaResponse;
import com.chek.media.model.media.MediaObjectDTO;
import com.chek.media.model.upload.PresignUploadRequest;
import com.chek.media.model.upload.PresignUploadResponse;
import com.chek.media.repo.MediaRepository;
import jakarta.annotation.PreDestroy;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.core.sync.RequestBody;

@Service
public class UploadService {
  private final MediaRepository mediaRepository;

  private final String presignMode;
  private final String bucket;
  private final String prefix;
  private final String region;
  private final String endpoint;

  private final S3Presigner presigner;
  private final S3Client s3Client;

  public UploadService(
      MediaRepository mediaRepository,
      @Value("${MEDIA_PRESIGN_MODE:mock}") String presignMode,
      @Value("${TOS_BUCKET:}") String bucket,
      @Value("${TOS_PREFIX:chek/media/}") String prefix,
      @Value("${TOS_REGION:cn-beijing}") String region,
      @Value("${TOS_ENDPOINT:}") String endpoint) {
    this.mediaRepository = mediaRepository;
    this.presignMode = presignMode;
    this.bucket = bucket;
    this.prefix = prefix;
    this.region = region;
    this.endpoint = endpoint;

    boolean enabled = "s3".equalsIgnoreCase(presignMode) && bucket != null && !bucket.isBlank();
    String endpointOverride = endpoint == null || endpoint.isBlank() ? null : endpoint.trim();
    this.presigner = enabled ? buildPresigner(region, endpointOverride) : null;
    this.s3Client = enabled ? buildClient(region, endpointOverride) : null;
  }

  @PreDestroy
  public void shutdown() {
    try {
      if (presigner != null) presigner.close();
    } catch (Exception ignored) {
    }
    try {
      if (s3Client != null) s3Client.close();
    } catch (Exception ignored) {
    }
  }

  public PresignUploadResponse presign(String userOneId, PresignUploadRequest req) {
    String safeFilename = req.getFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
    String objectKey = normalizePrefix(prefix) + UUID.randomUUID() + "_" + safeFilename;

    String uploader = userOneId == null ? "" : userOneId.trim();
    long mediaObjectId =
        mediaRepository.createObject(bucket, objectKey, req.getContentType(), req.getSizeBytes(), uploader, "PRESIGNED");

    PresignUploadResponse resp = new PresignUploadResponse();
    resp.setMediaObjectId(mediaObjectId);
    resp.setObjectKey(objectKey);

    if (presigner == null) {
      resp.setMock(true);
      resp.setPutUrl("");
      return resp;
    }

    PutObjectRequest putObjectRequest =
        PutObjectRequest.builder()
            .bucket(bucket)
            .key(objectKey)
            .contentType(req.getContentType())
            .build();
    PutObjectPresignRequest presignRequest =
        PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(10))
            .putObjectRequest(putObjectRequest)
            .build();
    PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);

    resp.setMock(false);
    resp.setPutUrl(String.valueOf(presigned.url()));
    return resp;
  }

  public PresignUploadResponse uploadDirect(String userOneId, MultipartFile file) throws Exception {
    String filename = file == null ? "" : String.valueOf(file.getOriginalFilename());
    String safeFilename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    if (safeFilename.isBlank()) safeFilename = "upload.bin";

    String objectKey = normalizePrefix(prefix) + UUID.randomUUID() + "_" + safeFilename;
    String uploader = userOneId == null ? "" : userOneId.trim();

    PresignUploadResponse resp = new PresignUploadResponse();
    resp.setObjectKey(objectKey);

    if (s3Client == null) {
      long mediaObjectId =
          mediaRepository.createObject(bucket, objectKey, file == null ? "" : file.getContentType(), file == null ? null : file.getSize(), uploader, "DIRECT_MOCK");
      resp.setMediaObjectId(mediaObjectId);
      resp.setMock(true);
      resp.setPutUrl("");
      return resp;
    }

    String contentType = file.getContentType();
    if (contentType == null || contentType.isBlank()) contentType = "application/octet-stream";
    long sizeBytes = file.getSize();

    PutObjectRequest putObjectRequest =
        PutObjectRequest.builder().bucket(bucket).key(objectKey).contentType(contentType).build();
    try (InputStream in = file.getInputStream()) {
      s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(in, sizeBytes));
    }

    long mediaObjectId = mediaRepository.createObject(bucket, objectKey, contentType, sizeBytes, uploader, "UPLOADED");
    resp.setMediaObjectId(mediaObjectId);
    resp.setMock(false);
    resp.setPutUrl("");
    return resp;
  }

  public GetMediaResponse getMedia(long mediaObjectId) {
    MediaObjectDTO obj = mediaRepository.getById(mediaObjectId);
    if (obj == null) return null;

    GetMediaResponse resp = new GetMediaResponse();
    resp.setMediaObjectId(obj.getMediaObjectId());
    resp.setBucket(obj.getBucket());
    resp.setObjectKey(obj.getObjectKey());
    resp.setContentType(obj.getContentType());
    resp.setSizeBytes(obj.getSizeBytes());

    if (presigner == null) {
      resp.setMock(true);
      resp.setGetUrl("");
      return resp;
    }

    GetObjectRequest getObjectRequest =
        GetObjectRequest.builder().bucket(obj.getBucket()).key(obj.getObjectKey()).build();
    GetObjectPresignRequest presignRequest =
        GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(10))
            .getObjectRequest(getObjectRequest)
            .build();
    PresignedGetObjectRequest presigned = presigner.presignGetObject(presignRequest);

    resp.setMock(false);
    resp.setGetUrl(String.valueOf(presigned.url()));
    return resp;
  }

  private static String normalizePrefix(String prefix) {
    if (prefix == null || prefix.isBlank()) return "";
    String p = prefix.trim();
    p = p.replaceAll("^/+", "").replaceAll("/+$", "");
    return p.isEmpty() ? "" : (p + "/");
  }

  private static S3Presigner buildPresigner(String region, String endpoint) {
    S3Presigner.Builder b = S3Presigner.builder().region(Region.of(region == null ? "cn-beijing" : region));
    if (endpoint != null && !endpoint.isBlank()) b = b.endpointOverride(URI.create(endpoint));
    return b.build();
  }

  private static S3Client buildClient(String region, String endpoint) {
    S3Client.Builder b = S3Client.builder().region(Region.of(region == null ? "cn-beijing" : region));
    if (endpoint != null && !endpoint.isBlank()) b = b.endpointOverride(URI.create(endpoint));
    return b.build();
  }
}
