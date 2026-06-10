"""Check that every className token in given .tsx files exists in the built CSS."""
import re
import sys

css_path, *files = sys.argv[1:]
css = open(css_path, encoding="utf-8").read()

tokens = set()
for f in files:
    src = open(f, encoding="utf-8").read()
    for m in re.findall(r'className="([^"]*)"', src):
        tokens.update(m.split())
    for m in re.findall(r"'([^']*)'", src):
        # strings inside cn(...) — only keep tailwind-looking tokens
        for t in m.split():
            if re.fullmatch(r"[-!a-zA-Z0-9:/\[\].%()]+", t) and "-" in t:
                tokens.add(t)


def escaped(t):
    return re.sub(r"([:./\[\]()%!])", lambda x: "\\" + x.group(1), t.lstrip("!"))


missing = [t for t in sorted(tokens) if ("." + escaped(t)) not in css]
print("\n".join(missing) if missing else "ALL PRESENT")
