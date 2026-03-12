# ═══════════════════════════════════════
# SAFARA — Safety Scoring Engine
# ═══════════════════════════════════════

from datetime import datetime
import math

class SafetyEngine:
    """
    Calculates safety scores for map areas.
    Score: 1 (very unsafe) → 10 (very safe)
    Only confirmed incidents affect routing.
    """

    DECAY_DAYS = 30   # Incidents older than this decay
    RADIUS_KM  = 0.5  # Area radius for incident lookup

    def calculate_area_score(self, lat, lng, all_incidents):
        """Calculate safety score for a given lat/lng area."""
        nearby = self._get_nearby(lat, lng, all_incidents)
        confirmed = [i for i in nearby if i.get('status') == 'confirmed']
        if not confirmed:
            return 9  # Default high safety

        weighted = sum(self._weighted_score(i) for i in confirmed)
        score = max(2, 10 - weighted)
        return round(min(10, score), 1)

    def _get_nearby(self, lat, lng, incidents):
        """Return incidents within RADIUS_KM of given point."""
        result = []
        for i in incidents:
            dist = self._haversine(lat, lng, i.get('lat', lat), i.get('lng', lng))
            if dist <= self.RADIUS_KM:
                result.append(i)
        return result

    def _weighted_score(self, incident):
        """Weight an incident by recency and credibility."""
        recency = self._recency_factor(incident.get('timestamp',''))
        credibility = incident.get('credibility', 1) / 10.0
        return recency * credibility * 1.5

    def _recency_factor(self, timestamp_str):
        """More recent = higher weight (1.0 = today, 0.0 = 30+ days ago)."""
        try:
            ts = datetime.fromisoformat(timestamp_str[:19])
            days_old = (datetime.now() - ts).days
            return max(0.0, 1.0 - (days_old / self.DECAY_DAYS))
        except:
            return 0.5

    def _haversine(self, lat1, lon1, lat2, lon2):
        """Distance in km between two lat/lng points."""
        R = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (math.sin(d_lat/2)**2 +
             math.cos(math.radians(lat1)) *
             math.cos(math.radians(lat2)) *
             math.sin(d_lon/2)**2)
        return R * 2 * math.asin(math.sqrt(a))

    def route_safety_score(self, waypoints, all_incidents):
        """Calculate overall safety score for a full route."""
        if not waypoints:
            return 9
        scores = [self.calculate_area_score(p[0], p[1], all_incidents) for p in waypoints]
        return round(sum(scores) / len(scores), 1)
