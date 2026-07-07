import os
import json
import logging
import requests
import math
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
from .utils.normalization import normalize
from .metrics import calculate_available_capacity_by_role

load_dotenv()

logger = logging.getLogger(__name__)

def build_report_metrics(
    solver_output: dict,
    employees: list,
    daily_demand: dict,
    target_date: date,
    settings=None
) -> dict:
    # 1. workforce
    num_employees = len(employees)
    chefs = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "chef"]
    regular_emps = [emp for emp in employees if normalize(emp.get("Role", emp.get("role", ""))) == "employee"]
    
    # 2. capacity
    metrics = solver_output.get("metrics", {})
    violations = solver_output.get("violations", {})
    assignments = solver_output.get("assignments", [])
    
    total_required = metrics.get("total_required_shifts", 0)
    total_capacity = metrics.get("total_available_capacity", 0)
    covered_shifts = len(assignments)
    uncovered_shifts = max(0, total_required - covered_shifts)
    coverage_rate = round((covered_shifts / max(1, total_required)) * 100, 1)
    
    # 3. chef_coverage
    chef_ids = {emp.get("EmpID", emp.get("id")) for emp in chefs}
    assigned_chef_shifts = sum(
        1 for a in assignments
        if (a.employee_id if hasattr(a, "employee_id") else a.get("employee_id") if isinstance(a, dict) else None) in chef_ids
    )
    
    monday = target_date - timedelta(days=target_date.weekday())
    dates = [monday + timedelta(days=i) for i in range(7)]
    
    required_chef_shifts = 0
    from .solver import ScheduleSolver
    solver_instance = ScheduleSolver()
    
    for d_date in dates:
        for shift_name in ["Morning", "Night"]:
            req_staff = solver_instance._calculate_required_staff(shift_name, daily_demand, d_date, settings)
            req_chef = math.ceil(0.25 * req_staff)
            required_chef_shifts += req_chef
            
    chef_deficit = max(0, required_chef_shifts - assigned_chef_shifts)
    
    # 4. workload
    workloads = {emp.get("EmpID", emp.get("id")): 0 for emp in employees}
    for a in assignments:
        emp_id = a.employee_id if hasattr(a, "employee_id") else a.get("employee_id") if isinstance(a, dict) else None
        if emp_id in workloads:
            workloads[emp_id] += 1
    w_vals = list(workloads.values())
    max_assigned = max(w_vals) if w_vals else 0
    min_assigned = min(w_vals) if w_vals else 0
    average_assigned = round(sum(w_vals) / max(1, num_employees), 1)
    workload_imbalance = max_assigned - min_assigned
    
    # 5. violations
    clopening_count = violations.get("clopening_count", 0)
    weekly_limit_violations = 0
    for emp in employees:
        emp_id = emp.get("EmpID", emp.get("id"))
        w_limit = emp.get("WorkingDaysPerWeek", emp.get("max_shifts_per_week", 5))
        if workloads.get(emp_id, 0) > w_limit:
            weekly_limit_violations += 1
            
    daily_work_counts = {}
    for a in assignments:
        emp_id = a.employee_id if hasattr(a, "employee_id") else a.get("employee_id") if isinstance(a, dict) else None
        a_date = str(a.Date if hasattr(a, "Date") else a.get("date") if isinstance(a, dict) else "")
        key = (emp_id, a_date)
        daily_work_counts[key] = daily_work_counts.get(key, 0) + 1
        
    daily_limit_violations = sum(1 for count in daily_work_counts.values() if count > 1)
    
    # Check availability violations
    availability_violations = 0
    for a in assignments:
        emp_id = a.employee_id if hasattr(a, "employee_id") else a.get("employee_id") if isinstance(a, dict) else None
        emp = next((e for e in employees if e.get("EmpID", e.get("id")) == emp_id), None)
        if emp:
            raw_avail = emp.get("availability")
            if raw_avail is not None:
                avail_map = {}
                if isinstance(raw_avail, dict):
                    for k, v in raw_avail.items():
                        avail_map[str(k)] = [normalize(s) for s in v]
                elif isinstance(raw_avail, list):
                    for item in raw_avail:
                        if isinstance(item, dict) and "date" in item:
                            avail_map[str(item["date"])] = [normalize(s) for s in item.get("shifts", [])]
                
                a_date = str(a.Date if hasattr(a, "Date") else a.get("date") if isinstance(a, dict) else "")
                a_shift = normalize(a.ShiftType if hasattr(a, "ShiftType") else a.get("shift") if isinstance(a, dict) else "")
                allowed_shifts = avail_map.get(a_date)
                if allowed_shifts is None or a_shift not in allowed_shifts:
                    availability_violations += 1
                    
    hard_constraint_violations = weekly_limit_violations + daily_limit_violations + availability_violations
    
    # 6. forecast
    daily_demand_totals = {}
    for d_date in dates:
        morning_req = solver_instance._calculate_required_staff("Morning", daily_demand, d_date, settings)
        night_req = solver_instance._calculate_required_staff("Night", daily_demand, d_date, settings)
        daily_demand_totals[str(d_date)] = morning_req + night_req
        
    peak_day = max(daily_demand_totals, key=daily_demand_totals.get) if daily_demand_totals else ""
    peak_demand = daily_demand_totals.get(peak_day, 0)
    weekly_average_demand = round(sum(daily_demand_totals.values()) / max(1, len(daily_demand_totals)), 1)
    
    # 7. system_health
    capacity_gap = total_required - total_capacity
    staffing_shortage = uncovered_shifts
    chef_shortage = chef_deficit
    
    return {
        "workforce": {
            "total_employees": num_employees,
            "chefs": len(chefs),
            "regular_employees": len(regular_emps)
        },
        "capacity": {
            "required_shifts": total_required,
            "available_shifts": total_capacity,
            "covered_shifts": covered_shifts,
            "uncovered_shifts": uncovered_shifts,
            "coverage_rate": coverage_rate
        },
        "chef_coverage": {
            "required_chef_shifts": required_chef_shifts,
            "assigned_chef_shifts": assigned_chef_shifts,
            "chef_deficit": chef_deficit
        },
        "workload": {
            "max_assigned": max_assigned,
            "min_assigned": min_assigned,
            "average_assigned": average_assigned,
            "workload_imbalance": workload_imbalance
        },
        "violations": {
            "clopening_count": clopening_count,
            "weekly_limit_violations": weekly_limit_violations,
            "hard_constraint_violations": hard_constraint_violations
        },
        "forecast": {
            "peak_day": peak_day,
            "peak_demand": peak_demand,
            "weekly_average_demand": weekly_average_demand
        },
        "system_health": {
            "capacity_gap": capacity_gap,
            "staffing_shortage": staffing_shortage,
            "chef_shortage": chef_shortage
        }
    }


def calculate_health_score(metrics: dict) -> tuple:
    score = 100
    
    # 1. Coverage
    cov = metrics["capacity"]["coverage_rate"]
    if cov >= 95:
        score -= 0
    elif cov >= 80:
        score -= 10
    elif cov >= 60:
        score -= 25
    else:
        score -= 40
        
    # 2. Chef deficit
    if metrics["chef_coverage"]["chef_deficit"] > 0:
        score -= 15
        
    # 3. Hard constraint violations
    violations = metrics["violations"]["hard_constraint_violations"]
    score -= violations * 10
    
    # 4. Capacity deficit
    if metrics["system_health"]["capacity_gap"] > 0:
        score -= 10
        
    # Clamp score
    score = max(0, min(100, score))
    
    # Status mapping
    if score >= 80:
        status = "healthy"
    elif score >= 50:
        status = "warning"
    else:
        status = "critical"
        
    return score, status


def generate_fallback_report(metrics: dict) -> dict:
    score = metrics["system_health"].get("health_score", 100)
    status = metrics["system_health"].get("status", "healthy")
    
    executive_summary = (
        f"Schedule generated with a health score of {score} ({status}). "
        f"Coverage rate is at {metrics['capacity']['coverage_rate']}%. "
    )
    if status == "critical":
        executive_summary += "Immediate operational adjustments are recommended."
    elif status == "warning":
        executive_summary += "Minor adjustments are recommended to improve coverage or role balancing."
    else:
        executive_summary += "The schedule is operationally healthy and stable."
        
    findings = []
    findings.append({
        "metric": "covered_shifts",
        "value": metrics["capacity"]["covered_shifts"],
        "description": f"Total assigned shifts: {metrics['capacity']['covered_shifts']} out of {metrics['capacity']['required_shifts']} required."
    })
    if metrics["chef_coverage"]["chef_deficit"] > 0:
        findings.append({
            "metric": "chef_deficit",
            "value": metrics["chef_coverage"]["chef_deficit"],
            "description": f"Chef shift shortage: deficit of {metrics['chef_coverage']['chef_deficit']} shifts."
        })
    else:
        findings.append({
            "metric": "chef_deficit",
            "value": 0,
            "description": "Chef shift coverage targets met."
        })
        
    warnings = []
    if metrics["capacity"]["coverage_rate"] < 80:
        warnings.append(f"Restaurant is understaffed. Required: {metrics['capacity']['required_shifts']} shifts, Available: {metrics['capacity']['available_shifts']} shifts. Consider hiring.")
    if metrics["chef_coverage"]["chef_deficit"] > 0:
        warnings.append("Chef shortage detected.")
    if metrics["violations"]["hard_constraint_violations"] > 0:
        warnings.append(f"{metrics['violations']['hard_constraint_violations']} hard constraint violations detected.")
    else:
        warnings.append("No hard constraint violations exist.")
        
    recommendations = []
    if metrics["capacity"]["coverage_rate"] < 80:
        recommendations.append("Hire additional staff or recruit temporary employees.")
    if metrics["chef_coverage"]["chef_deficit"] > 0:
        recommendations.append("Prioritize scheduling chefs or train existing employees to cover chef roles.")
    if metrics["violations"]["clopening_count"] > 0:
        recommendations.append("Review schedule to minimize clopening violations.")
    if not recommendations:
        recommendations.append("Maintain the current scheduling strategy.")
        
    return {
        "status": status,
        "health_score": score,
        "executive_summary": executive_summary,
        "findings": findings,
        "recommendations": recommendations,
        "warnings": warnings,
        "manager_summary": executive_summary,
        "risk_level": "High" if status == "critical" else "Medium" if status == "warning" else "Low",
        "key_issues": findings,
        "practical_actions": recommendations
    }


class LLMReportGenerator:
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.model = "llama-3.1-8b-instant"
        self.url = "https://api.groq.com/openai/v1/chat/completions"
        
    def _clean_solver_output(self, solver_output: dict) -> dict:
        """
        Input Safety Rule (Step 5):
        Before sending data to LLM:
        - REMOVE logs
        - REMOVE debug fields
        - REMOVE internal diagnostics noise
        - KEEP ONLY metrics, violations, assignments summary, warnings, suggestions.
        """
        cleaned = {}
        
        status = solver_output.get("status")
        cleaned["solver_status"] = status
        cleaned["status"] = status
        
        # Extract metrics (handle nested and flat)
        metrics = solver_output.get("metrics", {})
        cleaned["total_required_shifts"] = metrics.get("total_required_shifts", solver_output.get("total_required_shifts"))
        cleaned["total_available_capacity"] = metrics.get("total_available_capacity", solver_output.get("total_available_capacity"))
        cleaned["missing_shifts"] = metrics.get("missing_shifts", solver_output.get("missing_shifts"))
        cleaned["capacity_utilization_pct"] = metrics.get("utilization_percentage", solver_output.get("capacity_utilization_pct"))
        
        # Preserve new structured metrics payload keys if they exist in solver_output or in metrics
        for key in ["workforce_metrics", "capacity_metrics", "coverage_metrics", "workload_metrics", "demand_metrics", "off_day_metrics", "llm_metrics_payload"]:
            if key in solver_output:
                cleaned[key] = solver_output[key]
            elif key in metrics:
                cleaned[key] = metrics[key]
        
        # Extract violations (handle nested and flat)
        violations = solver_output.get("violations", {})
        cleaned["clopening_violations_count"] = violations.get("clopening_count", solver_output.get("clopening_violations_count", 0))
        cleaned["understaffing_count"] = violations.get("understaffing_count", solver_output.get("understaffing_count", 0))
        
        # Keep warnings & suggestions & skipped_overrides
        cleaned["warnings"] = solver_output.get("warnings", [])
        cleaned["suggestions"] = solver_output.get("suggestions", [])
        cleaned["skipped_overrides"] = solver_output.get("skipped_overrides", [])
        
        # Build assignments summary
        assignments = solver_output.get("assignments", [])
        summary = solver_output.get("summary", {})
        
        assignments_summary = {
            "total_assigned_shifts": len(assignments)
        }
        if assignments:
            roles = []
            for a in assignments:
                role = None
                if isinstance(a, dict):
                    role = a.get("role", a.get("Role"))
                else:
                    role = getattr(a, "Role", None)
                if role:
                    roles.append(role)
                    
            roles_count = {}
            for r in roles:
                roles_count[r] = roles_count.get(r, 0) + 1
            assignments_summary["role_distribution"] = roles_count
            
        if summary:
            assignments_summary.update(summary)
            
        cleaned["assignments_summary"] = assignments_summary
        return cleaned

    def _convert_legacy_payload(self, legacy: dict) -> dict:
        # Construct a default/empty structured payload based on legacy data
        metrics = legacy.get("metrics", {})
        violations = legacy.get("violations", {})
        
        # Build workforce
        workforce = {
            "total_employees": metrics.get("workforce_metrics", {}).get("total_employees", 6),
            "chefs": metrics.get("workforce_metrics", {}).get("total_chefs", 3),
            "regular_employees": metrics.get("workforce_metrics", {}).get("total_regular_employees", 3)
        }
        # capacity
        capacity = {
            "required_shifts": metrics.get("total_required_shifts", 28),
            "available_shifts": metrics.get("total_available_capacity", 30),
            "covered_shifts": metrics.get("covered", 28),
            "uncovered_shifts": metrics.get("uncovered", 0),
            "coverage_rate": metrics.get("coverage_rate", 100.0)
        }
        # chef_coverage
        chef_coverage = {
            "required_chef_shifts": metrics.get("demand_metrics", {}).get("total_required_chefs", 7),
            "assigned_chef_shifts": metrics.get("coverage_metrics", {}).get("chef_assigned_count", 7),
            "chef_deficit": metrics.get("chef_deficit", 0)
        }
        # workload
        workload = {
            "max_assigned": metrics.get("workload_metrics", {}).get("max_workload", 5),
            "min_assigned": metrics.get("workload_metrics", {}).get("min_workload", 4),
            "average_assigned": metrics.get("workload_metrics", {}).get("average_workload", 4.7),
            "workload_imbalance": metrics.get("workload_metrics", {}).get("workload_variance", 1)
        }
        # violations
        violations_dict = {
            "clopening_count": violations.get("clopening_count", 0),
            "weekly_limit_violations": 0,
            "hard_constraint_violations": 0
        }
        # forecast
        forecast = {
            "peak_day": "2026-06-01",
            "peak_demand": 4,
            "weekly_average_demand": 4.0
        }
        # system_health
        system_health = {
            "capacity_gap": capacity["required_shifts"] - capacity["available_shifts"],
            "staffing_shortage": capacity["uncovered_shifts"],
            "chef_shortage": chef_coverage["chef_deficit"],
            "health_score": 100,
            "status": "healthy"
        }
        
        # Recalculate health score for legacy input
        score = 100
        cov = capacity["coverage_rate"]
        if cov >= 95:
            score -= 0
        elif cov >= 80:
            score -= 10
        elif cov >= 60:
            score -= 25
        else:
            score -= 40
            
        if chef_coverage["chef_deficit"] > 0:
            score -= 15
        
        score = max(0, min(100, score))
        if score >= 80:
            status = "healthy"
        elif score >= 50:
            status = "warning"
        else:
            status = "critical"
            
        system_health["health_score"] = score
        system_health["status"] = status
        
        return {
            "workforce": workforce,
            "capacity": capacity,
            "chef_coverage": chef_coverage,
            "workload": workload,
            "violations": violations_dict,
            "forecast": forecast,
            "system_health": system_health
        }

    def _validate_analysis(self, analysis: dict) -> bool:
        required_keys = ["status", "health_score", "executive_summary", "findings", "recommendations", "warnings"]
        for key in required_keys:
            if key not in analysis:
                return False
        if not isinstance(analysis["findings"], list):
            return False
        if not isinstance(analysis["recommendations"], list):
            return False
        if not isinstance(analysis["warnings"], list):
            return False
        if not isinstance(analysis["health_score"], (int, float)):
            return False
        if analysis["status"] not in ["healthy", "warning", "critical"]:
            return False
        for f in analysis["findings"]:
            if not isinstance(f, dict) or "metric" not in f or "description" not in f:
                return False
        return True

    def generate_report(self, payload: dict) -> dict:
        """
        Generates a structured JSON operations report based on the provided scheduling metrics.
        Rules:
        - Factual calculations happen in Python backend code.
        - LLM serves as a structured analysis/explanation layer.
        - Outputs valid JSON matching a specific schema.
        """
        # Ensure we operate on the structured metrics format
        if not all(k in payload for k in ["workforce", "capacity", "chef_coverage", "workload", "violations", "forecast", "system_health"]):
            payload = self._convert_legacy_payload(payload)
            
        print(f"[LLM DEBUG] API key present: {bool(self.api_key)}")
        if not self.api_key:
            logger.info("GROQ_API_KEY environment variable is missing. Returning backend fallback report.")
            return generate_fallback_report(payload)
            
        try:
            system_prompt = (
                "You are a restaurant workforce operations analyst.\n\n"
                "Analyze the provided scheduling metrics.\n\n"
                "Rules:\n\n"
                "1. Use ONLY provided metrics.\n"
                "2. Never invent numbers.\n"
                "3. Never perform calculations.\n"
                "4. Never estimate missing information.\n"
                "5. Never contradict provided metrics.\n"
                "6. If coverage_rate < 80:\n"
                "   mention understaffing.\n"
                "7. If chef_deficit > 0:\n"
                "   mention chef shortage.\n"
                "8. If hard_constraint_violations == 0:\n"
                "   explicitly state that no hard constraint violations exist.\n"
                "9. Recommendations must be practical and concise.\n"
                "10. Output valid JSON only.\n\n"
                "Return JSON matching exactly:\n\n"
                "{\n"
                '  "status": "healthy | warning | critical",\n'
                '  "health_score": integer,\n'
                '  "executive_summary": "",\n'
                '  "findings": [\n'
                '    {\n'
                '      "metric": "string (e.g. coverage_rate, chef_deficit, etc.)",\n'
                '      "value": number or null,\n'
                '      "description": "string"\n'
                '    }\n'
                '  ],\n'
                '  "recommendations": [],\n'
                '  "warnings": []\n'
                "}"
            )
            
            user_prompt = f"Scheduling Metrics JSON:\n{json.dumps(payload, indent=2)}"
            
            payload_body = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            print(f"[LLM DEBUG] Calling Groq API endpoint: {self.url}")
            logger.debug(f"Calling Groq API endpoint: {self.url}")
            
            response = requests.post(self.url, json=payload_body, headers=headers, timeout=10.0)
            
            print(f"[LLM DEBUG] Status code: {response.status_code}")
            logger.debug(f"Groq API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                response_json = response.json()
                content = response_json["choices"][0]["message"]["content"]
                print(f"[LLM DEBUG] Response body: {content}")
                
                try:
                    analysis = json.loads(content)
                    if self._validate_analysis(analysis):
                        analysis["manager_summary"] = analysis.get("executive_summary", "")
                        analysis["risk_level"] = "High" if analysis.get("status") == "critical" else "Medium" if analysis.get("status") == "warning" else "Low"
                        analysis["key_issues"] = analysis.get("findings", [])
                        analysis["practical_actions"] = analysis.get("recommendations", [])
                        return analysis
                    else:
                        logger.warning("LLM response validation failed. Returning backend fallback report.")
                        return generate_fallback_report(payload)
                except Exception as ex:
                    logger.warning(f"Error parsing LLM response JSON: {ex}. Returning backend fallback report.")
                    return generate_fallback_report(payload)
            else:
                logger.error(f"Groq API error: HTTP {response.status_code} - {response.text}")
                return generate_fallback_report(payload)
                
        except requests.exceptions.Timeout as t_err:
            logger.warning(f"Connection timeout during Groq API call: {str(t_err)}")
            return generate_fallback_report(payload)
        except Exception as e:
            logger.error(f"Failed to generate LLM report: {str(e)}")
            return generate_fallback_report(payload)
