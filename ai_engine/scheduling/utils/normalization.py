def normalize(text: str) -> str:
    if text is None:
        return None
    val = str(text).strip().lower()
    
    # Standardize shift values
    if val in ["evening", "evening shift", "night", "night shift"]:
        return "night"
    if val in ["morning", "morning shift"]:
        return "morning"
        
    return val
