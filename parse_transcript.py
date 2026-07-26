import json
with open('/Users/ilalu/.gemini/antigravity/brain/cf8974c2-d3c7-4f1a-95c8-67bcf3c50610/.system_generated/logs/transcript.jsonl', 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data['type'] == 'USER_INPUT':
                print(f"USER: {data['content']}")
            elif data['type'] == 'PLANNER_RESPONSE':
                text = data.get('content', '')
                if text:
                    print(f"AGENT: {text[:200]}...")
        except:
            pass
