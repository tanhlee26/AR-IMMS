import { BoundingBox } from '../types/marker';

export interface SmoothedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  opacity: number;
}

/**
 * Bộ lọc làm mượt chuyển động AR (AR Motion Smoothing Tracker)
 * Sử dụng thuật toán Linear Interpolation (LERP) và Exponential Moving Average (EMA):
 * P_next = P_current + alpha * (P_target - P_current)
 * Giúp thẻ thông số ảo bám dính theo mã QR/ArUco ở 60fps, loại bỏ triệt để rung giật do tay rung.
 */
export class ARMotionTracker {
  private currentX = 0;
  private currentY = 0;
  private currentWidth = 180;
  private currentHeight = 180;
  private lastTargetTimestamp = 0;
  private isTracking = false;

  // Hệ số phản hồi LERP (0.35 cân bằng tối ưu giữa độ bám nhạy và độ êm ái)
  private readonly alpha: number;
  // Thời gian duy trì vị trí thẻ khi mã bị che khuất thoáng qua (1.5s)
  private readonly persistenceMs: number;

  constructor(alpha = 0.35, persistenceMs = 1500) {
    this.alpha = alpha;
    this.persistenceMs = persistenceMs;
  }

  /**
   * Cập nhật vị trí mục tiêu mới từ kết quả quét camera
   */
  public updateTarget(box: BoundingBox) {
    const rawX = box.left;
    const rawY = box.top;
    const rawW = Math.max(box.right - box.left, box.width || 120);
    const rawH = Math.max(box.bottom - box.top, box.height || 120);

    if (!this.isTracking) {
      // Lần đầu nhận diện: dịch chuyển tức thời để đạt độ trễ < 50ms (không cần lerp chậm)
      this.currentX = rawX;
      this.currentY = rawY;
      this.currentWidth = rawW;
      this.currentHeight = rawH;
      this.isTracking = true;
    } else {
      // Các frame tiếp theo: làm mượt LERP
      this.currentX += this.alpha * (rawX - this.currentX);
      this.currentY += this.alpha * (rawY - this.currentY);
      this.currentWidth += this.alpha * (rawW - this.currentWidth);
      this.currentHeight += this.alpha * (rawH - this.currentHeight);
    }

    this.lastTargetTimestamp = Date.now();
  }

  /**
   * Tính toán vị trí hiển thị hiện tại của thẻ AR
   */
  public getSmoothedPosition(screenWidth: number, screenHeight: number): SmoothedBoundingBox | null {
    if (!this.isTracking) return null;

    const timeSinceLastTarget = Date.now() - this.lastTargetTimestamp;
    if (timeSinceLastTarget > this.persistenceMs) {
      this.isTracking = false;
      return null;
    }

    // Tính opacity mờ dần nếu bị khuất quá 1s
    let opacity = 1.0;
    if (timeSinceLastTarget > 1000) {
      opacity = Math.max(0, 1.0 - (timeSinceLastTarget - 1000) / (this.persistenceMs - 1000));
    }

    const centerX = this.currentX + this.currentWidth / 2;
    const centerY = this.currentY + this.currentHeight / 2;

    return {
      x: Math.min(Math.max(10, this.currentX), screenWidth - 200),
      y: Math.min(Math.max(60, this.currentY), screenHeight - 200),
      width: this.currentWidth,
      height: this.currentHeight,
      centerX,
      centerY,
      opacity,
    };
  }

  public reset() {
    this.isTracking = false;
    this.lastTargetTimestamp = 0;
  }
}

/**
 * Hàm lerp độc lập cho các thuộc tính số
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.min(Math.max(t, 0), 1);
}
