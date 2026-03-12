# ═══════════════════════════════════════
# SAFARA — Reputation Engine
# ═══════════════════════════════════════

class ReputationEngine:
    """
    Manages user trust scores.
    New user     → 1
    Active       → 3
    Trusted      → 5
    Verified     → 8+
    """

    def label(self, score):
        if score >= 8: return 'Verified'
        if score >= 5: return 'Trusted'
        if score >= 3: return 'Active'
        return 'New'

    def on_report_submitted(self, current_score):
        """Slight increase for submitting (max 10)"""
        return min(10, round(current_score + 0.5, 1))

    def on_report_confirmed(self, current_score):
        """NGO confirms report → reputation boost"""
        return min(10, round(current_score + 1.0, 1))

    def on_report_rejected(self, current_score):
        """NGO rejects report → reputation penalty"""
        return max(1, round(current_score - 1.5, 1))

    def calculate_credibility(self, reports):
        """
        Total credibility score from a group of reports.
        Used to decide if incident should be sent to NGO.
        Threshold: >= 10 → flag for NGO review
        """
        return sum(r.get('reputation', 1) for r in reports)

    def should_flag(self, reports, threshold=10):
        return self.calculate_credibility(reports) >= threshold
