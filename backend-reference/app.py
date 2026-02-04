"""
============================================
BugTracker Pro - Flask Backend Reference
============================================
This file demonstrates the Flask backend architecture
that would be used in a production environment.

Note: This is a reference implementation. In the current
React app, the backend is simulated using localStorage.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

# ============================================
# App Configuration
# ============================================

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///bugtracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# ============================================
# Database Models
# ============================================

class User(db.Model):
    """User model for authentication and role management"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='developer')  # admin, developer, tester
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    bugs_created = db.relationship('Bug', backref='creator', foreign_keys='Bug.created_by', lazy='dynamic')
    bugs_assigned = db.relationship('Bug', backref='assignee', foreign_keys='Bug.assigned_to', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }


class Bug(db.Model):
    """Bug model for issue tracking"""
    __tablename__ = 'bugs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, critical
    status = db.Column(db.String(20), nullable=False, default='open')  # open, in_progress, closed
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'created_by': self.created_by,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ActivityLog(db.Model):
    """Activity log for tracking bug changes"""
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100), nullable=False)
    bug_id = db.Column(db.Integer, nullable=False)
    bug_title = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='activities')
    
    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'bug_id': self.bug_id,
            'bug_title': self.bug_title,
            'user_id': self.user_id,
            'username': self.user.username if self.user else 'Unknown',
            'timestamp': self.timestamp.isoformat()
        }


# ============================================
# Utility Functions
# ============================================

def log_activity(action, bug, user):
    """Create an activity log entry"""
    log = ActivityLog(
        action=action,
        bug_id=bug.id,
        bug_title=bug.title,
        user_id=user.id
    )
    db.session.add(log)
    db.session.commit()


def check_role(required_roles):
    """Decorator to check user role"""
    def decorator(f):
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in required_roles:
                return jsonify({'error': 'Unauthorized'}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator


# ============================================
# Authentication Routes
# ============================================

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validation
    if not data.get('username') or len(data['username']) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if not data.get('password') or len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    # Create user
    user = User(
        username=data['username'],
        role=data.get('role', 'developer')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    token = create_access_token(identity=user.id)
    
    return jsonify({
        'user': user.to_dict(),
        'token': token
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    data = request.get_json()
    
    user = User.query.filter_by(username=data.get('username')).first()
    
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    token = create_access_token(identity=user.id)
    
    return jsonify({
        'user': user.to_dict(),
        'token': token
    })


@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())


# ============================================
# User Routes
# ============================================

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/developers', methods=['GET'])
@jwt_required()
def get_developers():
    """Get all developers"""
    developers = User.query.filter_by(role='developer').all()
    return jsonify([d.to_dict() for d in developers])


# ============================================
# Bug Routes
# ============================================

@app.route('/api/bugs', methods=['GET'])
@jwt_required()
def get_bugs():
    """Get all bugs with optional filters"""
    query = Bug.query
    
    # Apply filters
    status = request.args.get('status')
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    priority = request.args.get('priority')
    if priority and priority != 'all':
        query = query.filter_by(priority=priority)
    
    assigned_to = request.args.get('assigned_to')
    if assigned_to and assigned_to != 'all':
        if assigned_to == '':
            query = query.filter(Bug.assigned_to.is_(None))
        else:
            query = query.filter_by(assigned_to=int(assigned_to))
    
    search = request.args.get('search')
    if search:
        query = query.filter(
            db.or_(
                Bug.title.ilike(f'%{search}%'),
                Bug.description.ilike(f'%{search}%')
            )
        )
    
    bugs = query.order_by(Bug.updated_at.desc()).all()
    return jsonify([b.to_dict() for b in bugs])


@app.route('/api/bugs/<int:bug_id>', methods=['GET'])
@jwt_required()
def get_bug(bug_id):
    """Get a single bug by ID"""
    bug = Bug.query.get_or_404(bug_id)
    return jsonify(bug.to_dict())


@app.route('/api/bugs', methods=['POST'])
@jwt_required()
def create_bug():
    """Create a new bug (tester or admin)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role not in ['admin', 'tester']:
        return jsonify({'error': 'Only testers and admins can create bugs'}), 403
    
    data = request.get_json()
    
    # Validation
    if not data.get('title') or len(data['title']) < 5:
        return jsonify({'error': 'Title must be at least 5 characters'}), 400
    
    if not data.get('description') or len(data['description']) < 10:
        return jsonify({'error': 'Description must be at least 10 characters'}), 400
    
    bug = Bug(
        title=data['title'],
        description=data['description'],
        priority=data.get('priority', 'medium'),
        status='open',
        created_by=user_id,
        assigned_to=data.get('assigned_to')
    )
    
    db.session.add(bug)
    db.session.commit()
    
    log_activity('created', bug, user)
    
    return jsonify(bug.to_dict()), 201


@app.route('/api/bugs/<int:bug_id>', methods=['PUT'])
@jwt_required()
def update_bug(bug_id):
    """Update a bug"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    bug = Bug.query.get_or_404(bug_id)
    
    # Check permissions
    if user.role == 'tester' and bug.created_by != user_id:
        return jsonify({'error': 'Testers can only edit bugs they created'}), 403
    
    data = request.get_json()
    
    # Update fields
    if 'title' in data:
        bug.title = data['title']
    if 'description' in data:
        bug.description = data['description']
    if 'priority' in data:
        bug.priority = data['priority']
    if 'status' in data:
        bug.status = data['status']
    if 'assigned_to' in data and user.role == 'admin':
        bug.assigned_to = data['assigned_to']
    
    db.session.commit()
    
    log_activity('updated', bug, user)
    
    return jsonify(bug.to_dict())


@app.route('/api/bugs/<int:bug_id>/status', methods=['PATCH'])
@jwt_required()
def update_bug_status(bug_id):
    """Update bug status"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    bug = Bug.query.get_or_404(bug_id)
    
    data = request.get_json()
    new_status = data.get('status')
    
    # Check close permission
    if new_status == 'closed':
        if user.role == 'tester':
            return jsonify({'error': 'Testers cannot close bugs'}), 403
        if user.role == 'developer' and bug.assigned_to != user_id:
            return jsonify({'error': 'Only the assigned developer can close this bug'}), 403
    
    bug.status = new_status
    db.session.commit()
    
    log_activity(f'changed status to {new_status}', bug, user)
    
    return jsonify(bug.to_dict())


@app.route('/api/bugs/<int:bug_id>/assign', methods=['PATCH'])
@check_role(['admin'])
def assign_bug(bug_id):
    """Assign bug to developer (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    bug = Bug.query.get_or_404(bug_id)
    
    data = request.get_json()
    developer_id = data.get('assigned_to')
    
    if developer_id:
        developer = User.query.get(developer_id)
        if not developer or developer.role != 'developer':
            return jsonify({'error': 'Invalid developer'}), 400
    
    bug.assigned_to = developer_id
    db.session.commit()
    
    developer = User.query.get(developer_id) if developer_id else None
    action = f'assigned to {developer.username}' if developer else 'unassigned'
    log_activity(action, bug, user)
    
    return jsonify(bug.to_dict())


@app.route('/api/bugs/<int:bug_id>', methods=['DELETE'])
@check_role(['admin'])
def delete_bug(bug_id):
    """Delete a bug (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    bug = Bug.query.get_or_404(bug_id)
    
    log_activity('deleted', bug, user)
    
    db.session.delete(bug)
    db.session.commit()
    
    return '', 204


# ============================================
# Dashboard Routes
# ============================================

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get bug statistics for dashboard"""
    bugs = Bug.query.all()
    
    stats = {
        'total': len(bugs),
        'open': len([b for b in bugs if b.status == 'open']),
        'in_progress': len([b for b in bugs if b.status == 'in_progress']),
        'closed': len([b for b in bugs if b.status == 'closed']),
        'critical': len([b for b in bugs if b.priority == 'critical']),
        'high': len([b for b in bugs if b.priority == 'high']),
        'medium': len([b for b in bugs if b.priority == 'medium']),
        'low': len([b for b in bugs if b.priority == 'low'])
    }
    
    return jsonify(stats)


@app.route('/api/dashboard/workload', methods=['GET'])
@jwt_required()
def get_developer_workload():
    """Get developer workload summary"""
    developers = User.query.filter_by(role='developer').all()
    
    workload = []
    for dev in developers:
        assigned_bugs = Bug.query.filter_by(assigned_to=dev.id).all()
        workload.append({
            'developer_id': dev.id,
            'developer_name': dev.username,
            'assigned_bugs': len(assigned_bugs),
            'open_bugs': len([b for b in assigned_bugs if b.status == 'open']),
            'in_progress_bugs': len([b for b in assigned_bugs if b.status == 'in_progress'])
        })
    
    return jsonify(workload)


@app.route('/api/dashboard/activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """Get recent activity logs"""
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return jsonify([log.to_dict() for log in logs])


# ============================================
# Database Initialization
# ============================================

def init_db():
    """Initialize database with sample data"""
    db.create_all()
    
    # Check if already initialized
    if User.query.first():
        return
    
    # Create default users
    admin = User(username='admin', role='admin')
    admin.set_password('admin123')
    
    dev1 = User(username='developer1', role='developer')
    dev1.set_password('dev123')
    
    dev2 = User(username='developer2', role='developer')
    dev2.set_password('dev123')
    
    tester = User(username='tester1', role='tester')
    tester.set_password('test123')
    
    db.session.add_all([admin, dev1, dev2, tester])
    db.session.commit()
    
    print('Database initialized with sample data!')


# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    with app.app_context():
        init_db()
    
    app.run(debug=True, port=5000)
