lines = open("app.py", "r", encoding="utf-8").readlines()
for i in range(len(lines)):
    if 'hourly["date"] = hourly["timestamp"].dt.date' in lines[i]:
        if 'def daily_forecast(' in ''.join(lines[i-40:i]):
            lines[i] = '    hourly["date"] = hourly["timestamp"].dt.date\n'
        else:
            lines[i] = '            hourly["date"] = hourly["timestamp"].dt.date\n'
open("app.py", "w", encoding="utf-8").writelines(lines)
