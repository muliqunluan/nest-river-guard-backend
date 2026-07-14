// src/cameras/interfaces/camera-jwt-payload.ts
export interface CameraJwtPayload {
  /** 摄像头 deviceId */
  sub: string;
  /** 固定为 'camera'，用于区分用户 JWT */
  type: 'camera';
  /** 摄像头数据库 ID */
  cameraId: number;
}
