import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger("health_analyzer.longitudinal")

class LongitudinalService:
    @staticmethod
    def analyze_trajectory(history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes historical health predictions to identify risk progression trends.
        """
        if not history:
            return {
                "trend_direction": "Stable",
                "trend_slope": 0.0,
                "predicted_future_risk": "Low",
                "trajectory_message": "No historical checks found. Complete symptom reports to track your health over time.",
                "timeline": []
            }
            
        # Reverse history to get chronological order (oldest first)
        chrono_history = sorted(history, key=lambda x: x.get("timestamp", ""))
        
        # Map risk levels to numerical values
        risk_map = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        sev_map = {"mild": 1, "moderate": 2, "severe": 3}
        
        timeline_data = []
        risk_scores = []
        severity_scores = []
        
        for record in chrono_history:
            risk = record.get("risk_level", "Low")
            sev = record.get("severity", "moderate")
            
            risk_val = risk_map.get(risk, 1)
            sev_val = sev_map.get(sev, 2)
            
            risk_scores.append(risk_val)
            severity_scores.append(sev_val)
            
            # Format timestamp
            ts_str = record.get("timestamp", "")
            date_label = ""
            if ts_str:
                try:
                    dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    date_label = dt.strftime("%b %d, %H:%M")
                except Exception:
                    date_label = ts_str[:16]
            
            timeline_data.append({
                "date": date_label,
                "risk_score": risk_val,
                "severity_score": sev_val,
                "risk_level": risk,
                "severity": sev,
                "symptoms": record.get("symptoms", [])
            })
            
        # Analyze trend if we have 2 or more data points
        trend_direction = "Stable"
        trend_slope = 0.0
        predicted_future_risk = "Low"
        
        if len(risk_scores) >= 2:
            # Simple linear regression slope for risk values over time indexes
            x = list(range(len(risk_scores)))
            y = risk_scores
            
            n = len(x)
            sum_x = sum(x)
            sum_y = sum(y)
            sum_xx = sum(val**2 for val in x)
            sum_xy = sum(x[i] * y[i] for i in range(n))
            
            denominator = (n * sum_xx - sum_x**2)
            if denominator != 0:
                trend_slope = (n * sum_xy - sum_x * sum_y) / denominator
            else:
                trend_slope = 0.0
                
            # Determine direction based on slope
            if trend_slope > 0.15:
                trend_direction = "Deteriorating"
            elif trend_slope < -0.15:
                trend_direction = "Improving"
            else:
                trend_direction = "Stable"
                
            # Predict future risk score (extrapolate next index)
            next_idx = len(risk_scores)
            pred_score = risk_scores[-1] + (trend_slope * 1)
            # Clip between 1 and 4
            pred_score = max(1.0, min(4.0, pred_score))
            
            # Map back to category
            inv_risk_map = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
            predicted_future_risk = inv_risk_map[round(pred_score)]
        else:
            # Only 1 data point
            trend_direction = "Stable"
            trend_slope = 0.0
            predicted_future_risk = chrono_history[0].get("risk_level", "Low")
            
        # Formulate trajectory message
        if trend_direction == "Deteriorating":
            trajectory_message = (
                "WARNING: Your symptom reports show a progressive increase in risk and severity levels over time. "
                "This trajectory suggests your body is struggling to fight off the illness, or a condition is worsening. "
                "Please schedule a consultation with a primary care physician."
            )
        elif trend_direction == "Improving":
            trajectory_message = (
                "GOOD TREND: Your recent symptom profiles show positive recovery trends. "
                "Your calculated risk levels are decreasing. Continue resting, hydrating, and following your wellness routine."
            )
        else:
            # Stable
            latest_risk = chrono_history[-1].get("risk_level", "Low") if chrono_history else "Low"
            if latest_risk in ["High", "Critical"]:
                trajectory_message = (
                    "STABLE BUT HIGH: Your symptoms are persistent at a elevated risk level. "
                    "Even though they are not worsening, having continuous high-risk readings requires professional medical attention."
                )
            else:
                trajectory_message = (
                    "STABLE: Your health indicators are stable and showing normal baseline parameters. "
                    "Continue monitoring your symptoms and stay hydrated."
                )
                
        return {
            "trend_direction": trend_direction,
            "trend_slope": round(float(trend_slope), 2),
            "predicted_future_risk": predicted_future_risk,
            "trajectory_message": trajectory_message,
            "timeline": timeline_data
        }
