from flask import Flask, render_template, request, jsonify, make_response, render_template_string
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import requests
import datetime
import os

# 1. FIXED PATHS: Use absolute paths so Vercel always finds your files
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

app = Flask(
    __name__, 
    template_folder=os.path.join(project_root, 'templates'), 
    static_folder=os.path.join(project_root, 'static')
)

# 2. FIXED DB URL: Prioritize the non-pooling URL and strip incompatible arguments
raw_db_url = os.getenv("POSTGRES_URL_NON_POOLING") or os.getenv("POSTGRES_URL")

if raw_db_url and raw_db_url.startswith("postgres://"):
    # Convert to postgresql:// for SQLAlchemy
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
    
    # Strip out Supabase's custom pooling parameters that crash SQLAlchemy
    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0] + "?sslmode=require"
else:
    # Fallback for local testing
    DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class VisitorData(Base):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    browser = Column(String)
    location = Column(String) # Nation, State
    longitude = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    user_visit = Column(Integer) # How many times this single user visited
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_location_from_coords(lat, lon):
    """Reverse geocoding using Nominatim (OpenStreetMap)"""
    if not lat or not lon:
        return "Unknown"
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {'User-Agent': 'VercelAnalyticsApp/1.0'}
        response = requests.get(url, headers=headers).json()
        address = response.get('address', {})
        state = address.get('state', '')
        country = address.get('country', '')
        if state and country:
            return f"{country}, {state}"
        return country or "Unknown"
    except:
        return "Unknown"

@app.route('/')
def index():
    # Track individual user visits via cookies
    user_visits = int(request.cookies.get('user_visits', 0)) + 1
    
    # Read the provided HTML file (you will place index.html in the same folder)
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    resp = make_response(render_template_string(html_content))
    # Cookie lasts for 1 year
    resp.set_cookie('user_visits', str(user_visits), max_age=60*60*24*365)
    return resp

@app.route('/api/track', methods=['POST'])
def track_visitor():
    data = request.json
    lat = data.get('lat')
    lon = data.get('lon')
    
    # Extract Analytics
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    browser = request.user_agent.string
    user_visits = int(request.cookies.get('user_visits', 1))
    location_str = get_location_from_coords(lat, lon)

    # Save to Database
    db = SessionLocal()
    visitor = VisitorData(
        ip_address=ip_address,
        browser=browser,
        location=location_str,
        longitude=lon,
        latitude=lat,
        user_visit=user_visits
    )
    db.add(visitor)
    db.commit()
    db.close()
    
    return jsonify({"status": "success"})

@app.route('/Admin')
@app.route('/admin')  # Add this line so lowercase works too!
def admin_dashboard():
    db = SessionLocal()
    visitors = db.query(VisitorData).order_by(VisitorData.timestamp.desc()).all()
    total_visits = db.query(VisitorData).count()
    db.close()
    
    # Simple HTML table for Admin
    admin_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Analytics Admin</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f4f4f9; }
            table { width: 100%; border-collapse: collapse; background: white; }
            th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #4a8cff; color: white; }
        </style>
    </head>
    <body>
        <h2>Visitor Analytics Panel</h2>
        <p><strong>Total Platform Visits:</strong> {{ total_visits }}</p>
        <table>
            <tr>
                <th>ID</th>
                <th>IP Address</th>
                <th>Browser</th>
                <th>Location (Nation, State)</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>User Visit Count</th>
                <th>Time (UTC)</th>
            </tr>
            {% for v in visitors %}
            <tr>
                <td>{{ v.id }}</td>
                <td>{{ v.ip_address }}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="{{ v.browser }}">{{ v.browser }}</td>
                <td>{{ v.location }}</td>
                <td>{{ v.latitude }}</td>
                <td>{{ v.longitude }}</td>
                <td>{{ v.user_visit }}</td>
                <td>{{ v.timestamp.strftime('%Y-%m-%d %H:%M:%S') }}</td>
            </tr>
            {% endfor %}
        </table>
    </body>
    </html>
    """
    return render_template_string(admin_html, visitors=visitors, total_visits=total_visits)

if __name__ == '__main__':
    app.run(debug=True)