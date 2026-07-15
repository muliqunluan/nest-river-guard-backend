// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.PG_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  KEY: process.env.KEY,
  /**
   * 摄像头离线超时时间（秒）
   * 摄像头超过此时间未上报状态则自动标记为离线
   * 默认值：30 秒
   */
  cameraOfflineTimeout: parseInt(process.env.CAMERA_OFFLINE_TIMEOUT || '30', 10) * 1000,
  /**
   * 文件上传配置
   */
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10),  // 5MB
    maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE || '52428800', 10), // 50MB
  },
});