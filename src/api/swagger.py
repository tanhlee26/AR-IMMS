from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
from api.schemas import (
    LoginSchema, UserCreateSchema, SiteCreateSchema, RoomCreateSchema,
    RackCreateSchema, NodeCreateSchema, MarkerBindSchema, TelemetryIngestSchema,
    ThresholdConfigSchema, TicketCreateSchema, TicketNoteSchema, TicketClosureRequestSchema,
    AssetSpecSchema, WarrantyInfoSchema
)

spec = APISpec(
    title="AR-IMMS API (AR-Integrated Infrastructure Monitoring and Maintenance System)",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
    info=dict(
        description="RESTful API backend for AR-IMMS: Digital Twin Infrastructure Hierarchy, Real-Time Streaming Telemetry, AR Spatial Marker Scanning, Incident & Ticket Management, Asset Lifecycle & Compliance Auditing."
    )
)

# Security scheme definition for Bearer Token JWT
spec.components.security_scheme("BearerAuth", {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "JWT"
})

# Register schemas
spec.components.schema("LoginPayload", schema=LoginSchema)
spec.components.schema("UserCreatePayload", schema=UserCreateSchema)
spec.components.schema("SiteCreatePayload", schema=SiteCreateSchema)
spec.components.schema("RoomCreatePayload", schema=RoomCreateSchema)
spec.components.schema("RackCreatePayload", schema=RackCreateSchema)
spec.components.schema("NodeCreatePayload", schema=NodeCreateSchema)
spec.components.schema("MarkerBindPayload", schema=MarkerBindSchema)
spec.components.schema("TelemetryIngestPayload", schema=TelemetryIngestSchema)
spec.components.schema("ThresholdConfigPayload", schema=ThresholdConfigSchema)
spec.components.schema("TicketCreatePayload", schema=TicketCreateSchema)
spec.components.schema("TicketNotePayload", schema=TicketNoteSchema)
spec.components.schema("TicketClosureRequestPayload", schema=TicketClosureRequestSchema)
spec.components.schema("AssetSpecPayload", schema=AssetSpecSchema)
spec.components.schema("WarrantyInfoPayload", schema=WarrantyInfoSchema)