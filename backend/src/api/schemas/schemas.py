from marshmallow import Schema, fields, validate

class LoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)

class UserCreateSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    full_name = fields.Str(required=True)
    role_id = fields.Int(required=True)

class SiteCreateSchema(Schema):
    name = fields.Str(required=True)
    code = fields.Str(required=True)
    location = fields.Str(required=False, allow_none=True)
    description = fields.Str(required=False, allow_none=True)

class RoomCreateSchema(Schema):
    site_id = fields.Int(required=True)
    name = fields.Str(required=True)
    code = fields.Str(required=True)
    floor = fields.Str(required=False, allow_none=True)
    description = fields.Str(required=False, allow_none=True)

class RackCreateSchema(Schema):
    room_id = fields.Int(required=True)
    name = fields.Str(required=True)
    code = fields.Str(required=True)
    unit_capacity = fields.Int(required=False, load_default=42)
    power_capacity_watts = fields.Float(required=False, load_default=5000.0)

class NodeCreateSchema(Schema):
    rack_id = fields.Int(required=True)
    name = fields.Str(required=True)
    hostname = fields.Str(required=True)
    ip_address = fields.Str(required=True)
    mac_address = fields.Str(required=False, allow_none=True)
    rack_position_u = fields.Int(required=False, load_default=1)
    power_watts = fields.Float(required=False, load_default=150.0)

class MarkerBindSchema(Schema):
    node_id = fields.Int(required=True)
    marker_code = fields.Str(required=True)
    marker_type = fields.Str(required=False, load_default="ARUCO")
    spatial_coordinates_json = fields.Str(required=False, allow_none=True)

class TelemetryIngestSchema(Schema):
    node_id = fields.Int(required=True)
    agent_version = fields.Str(required=False, load_default="1.0.0")
    metrics = fields.List(fields.Dict(), required=True)
    containers = fields.List(fields.Dict(), required=False)

class ThresholdConfigSchema(Schema):
    metric_type = fields.Str(required=True)
    warning_threshold = fields.Float(required=True)
    critical_threshold = fields.Float(required=True)
    duration_seconds = fields.Int(required=False, load_default=30)

class TicketCreateSchema(Schema):
    node_id = fields.Int(required=True)
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    priority = fields.Str(required=False, load_default="MEDIUM")
    alert_id = fields.Int(required=False, allow_none=True)
    assigned_to_user_id = fields.Int(required=False, allow_none=True)

class TicketNoteSchema(Schema):
    note_text = fields.Str(required=True)

class TicketClosureRequestSchema(Schema):
    summary = fields.Str(required=True)
    resolution_details = fields.Str(required=True)

class AssetSpecSchema(Schema):
    node_id = fields.Int(required=True)
    cpu_model = fields.Str(required=True)
    cpu_cores = fields.Int(required=True)
    total_ram_gb = fields.Float(required=True)
    total_storage_gb = fields.Float(required=True)
    os_name = fields.Str(required=True)
    os_version = fields.Str(required=True)
    network_interfaces_json = fields.Str(required=False, allow_none=True)

class WarrantyInfoSchema(Schema):
    node_id = fields.Int(required=True)
    vendor = fields.Str(required=True)
    model_number = fields.Str(required=True)
    serial_number = fields.Str(required=True)
    support_contact = fields.Str(required=False, allow_none=True)
