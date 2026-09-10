export function formatPercent(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatTemp(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '--°C';
  return `${value.toFixed(1)}°C`;
}

export function formatMemory(mb?: number): string {
  if (mb === undefined || mb === null || isNaN(mb)) return '-- MB';
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

export function getStatusColor(status?: string): string {
  switch (status) {
    case 'ONLINE':
      return '#10B981'; // Xanh lá cây
    case 'WARNING':
      return '#F59E0B'; // Vàng cam
    case 'CRITICAL':
      return '#EF4444'; // Đỏ báo động
    case 'UNAVAILABLE':
    default:
      return '#6B7280'; // Xám mất kết nối
  }
}

export function getStatusLabel(status?: string): string {
  switch (status) {
    case 'ONLINE':
      return 'HOẠT ĐỘNG TỐT';
    case 'WARNING':
      return 'CẢNH BÁO';
    case 'CRITICAL':
      return 'NGUY CẤP';
    case 'UNAVAILABLE':
    default:
      return 'MẤT KẾT NỐI';
  }
}

export function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'CRITICAL':
      return '#EF4444';
    case 'HIGH':
      return '#F97316';
    case 'MEDIUM':
      return '#EAB308';
    case 'LOW':
    default:
      return '#3B82F6';
  }
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Vừa xong';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return `${Math.max(1, diffSec)} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}
