"""
AR-IMMS Tầng API Controller - Bộ điều khiển Báo cáo Thống kê MTTR & PUE (Reporting Controller)
Các endpoint trích xuất chỉ số hiệu quả năng lượng PUE, thời gian xử lý sự cố MTTR và tổng quan Dashboard.
"""
from flask import Blueprint, request
from core.container import container
from api.responses import success_response, error_response
from api.middleware import jwt_required

reporting_bp = Blueprint("reporting", __name__, url_prefix="/api/v1/reports")

@reporting_bp.route("/mttr", methods=["GET"])
@jwt_required
def get_mttr_report():
    """
    [GET] /api/v1/reports/mttr?days=30
    Trích xuất báo cáo chỉ số MTTR (Mean Time to Resolve), MTBF và phân tích theo mức độ ưu tiên.
    """
    days = int(request.args.get("days", 30))
    reporting_service = container.reporting_service()
    data = reporting_service.calculate_mttr(days=days)
    return success_response(data=data, message="Trích xuất báo cáo thống kê MTTR thành công.")

@reporting_bp.route("/pue", methods=["GET"])
@jwt_required
def get_pue_report():
    """
    [GET] /api/v1/reports/pue
    Trích xuất báo cáo chỉ số Hiệu quả Sử dụng Năng lượng PUE (Power Usage Effectiveness), công suất IT và phụ tải làm mát.
    """
    reporting_service = container.reporting_service()
    data = reporting_service.calculate_pue()
    return success_response(data=data, message="Trích xuất báo cáo chỉ số PUE thành công.")

@reporting_bp.route("/dashboard-summary", methods=["GET"])
@jwt_required
def get_dashboard_summary():
    """
    [GET] /api/v1/reports/dashboard-summary
    Trích xuất tổng quan bộ chỉ số KPI hệ thống (Nodes, Alerts, Tickets, PUE, MTTR, Uptime).
    """
    reporting_service = container.reporting_service()
    data = reporting_service.get_dashboard_summary()
    return success_response(data=data, message="Trích xuất tổng quan Dashboard KPI thành công.")

