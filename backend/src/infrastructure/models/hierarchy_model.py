from datetime import datetime
from infrastructure.databases import db

class SiteModel(db.Model):
    __tablename__ = 'sites'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    rooms = db.relationship('RoomModel', backref='site', cascade='all, delete-orphan', lazy=True)

class RoomModel(db.Model):
    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    floor = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    racks = db.relationship('RackModel', backref='room', cascade='all, delete-orphan', lazy=True)

class RackModel(db.Model):
    __tablename__ = 'racks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    unit_capacity = db.Column(db.Integer, default=42, nullable=False)
    total_power_capacity_watts = db.Column(db.Float, default=5000.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    nodes = db.relationship('NodeModel', backref='rack', cascade='all, delete-orphan', lazy=True)

class NodeModel(db.Model):
    __tablename__ = 'nodes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    rack_id = db.Column(db.Integer, db.ForeignKey('racks.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    hostname = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(50), nullable=False)
    mac_address = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='ONLINE', nullable=False)
    rack_position_u = db.Column(db.Integer, default=1, nullable=False)
    power_consumption_watts = db.Column(db.Float, default=150.0, nullable=False)
    last_ping_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    containers = db.relationship('ContainerModel', backref='node', cascade='all, delete-orphan', lazy=True)
    markers = db.relationship('MarkerModel', backref='node', cascade='all, delete-orphan', lazy=True)
    agents = db.relationship('DataCollectorAgentModel', backref='node', cascade='all, delete-orphan', lazy=True)

class ContainerModel(db.Model):
    __tablename__ = 'containers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False)
    container_id = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='RUNNING', nullable=False)
    cpu_usage_percent = db.Column(db.Float, default=0.0, nullable=False)
    memory_usage_mb = db.Column(db.Float, default=0.0, nullable=False)
    restarted_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class MarkerModel(db.Model):
    __tablename__ = 'markers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False)
    marker_type = db.Column(db.String(20), default='ARUCO', nullable=False)
    marker_code = db.Column(db.String(100), unique=True, nullable=False)
    spatial_coordinates_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class DataCollectorAgentModel(db.Model):
    __tablename__ = 'data_collector_agents'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False)
    agent_version = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='ACTIVE', nullable=False)
    api_key_hash = db.Column(db.String(255), nullable=True)
    last_heartbeat_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
