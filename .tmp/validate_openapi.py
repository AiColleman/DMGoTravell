import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

path = Path("sdd/diseno/openapi/dmgo-api-v1.yaml")
spec = yaml.safe_load(path.read_text(encoding="utf-8"))

paths = spec.get("paths", {})
operations = 0
examples = 0
errors = []


def validator_for(schema):
    root = dict(schema)
    root["components"] = spec.get("components", {})
    return Draft202012Validator(root)


for route, item in paths.items():
    for method, operation in item.items():
        if method not in {"get", "post", "put", "patch", "delete", "head", "options", "trace"}:
            continue
        operations += 1
        for status, response in operation.get("responses", {}).items():
            for media_type, media in response.get("content", {}).items():
                schema = media.get("schema", {})
                candidates = []
                if "example" in media:
                    candidates.append(media["example"])
                for name, example in media.get("examples", {}).items():
                    if isinstance(example, dict) and "value" in example:
                        candidates.append(example["value"])
                for value in candidates:
                    examples += 1
                    try:
                        validator_for(schema).validate(value)
                    except Exception as exc:
                        errors.append(f"{method.upper()} {route} {status} {media_type}: {exc}")

print(f"paths={len(paths)} operations={operations} examples={examples} errors={len(errors)}")
for error in errors[:20]:
    print(error)
sys.exit(1 if errors else 0)
