"""
Convert hard-coded dark Tailwind palettes in dashboard screens to theme tokens.

Many dashboard screens were written for a dark-only admin (bg-gray-900 cards,
text-white labels). In the default light theme that renders white text on
white. This rewrites each string literal independently:
  gray-950/900 surfaces -> bg-background / bg-card, gray-800/700 -> bg-muted,
  gray borders -> border-border, gray text -> text-muted-foreground,
  text-white -> text-foreground UNLESS the same string paints a coloured
  background (buttons like "bg-indigo-600 text-white" keep white text).

Usage: python scripts/theme-tokens.py <file> [<file> ...]
"""
import re
import sys

COLORED_BG = re.compile(r"(?<![\w:-])bg-(indigo|violet|purple|green|emerald|red|rose|yellow|amber|orange|blue|sky|cyan|teal|primary|destructive|black)(-\d+)?(?:/\d+)?\b")

REPLACEMENTS = [
    (r"bg-(gray|slate|zinc|neutral)-950(/\d+)?", "bg-background"),
    (r"bg-(gray|slate|zinc|neutral)-900(/\d+)?", "bg-card"),
    (r"bg-(gray|slate|zinc|neutral)-800(/\d+)?", "bg-muted"),
    (r"bg-(gray|slate|zinc|neutral)-700(/\d+)?", "bg-muted-foreground/20"),
    (r"hover:bg-(gray|slate|zinc|neutral)-(950|900|800|700)(/\d+)?", "hover:bg-muted"),
    (r"(divide|border)-(gray|slate|zinc|neutral)-(950|900|800|700|600)(/\d+)?", r"\1-border"),
    (r"(border-[trblxy])-(gray|slate|zinc|neutral)-(950|900|800|700|600)(/\d+)?", r"\1-border"),
    (r"placeholder-(gray|slate)-(400|500|600)", "placeholder:text-muted-foreground"),
    (r"text-(gray|slate|zinc|neutral)-(100|200)", "text-foreground"),
    (r"text-(gray|slate|zinc|neutral)-300", "text-foreground/80"),
    (r"text-(gray|slate|zinc|neutral)-(400|500|600)", "text-muted-foreground"),
    (r"text-(gray|slate|zinc|neutral)-700", "text-muted-foreground/60"),
    (r"hover:text-white", "hover:text-foreground"),
    (r"text-indigo-400", "text-primary"),
    (r"(focus:)?border-indigo-500", r"\1border-primary"),
]


def fix_string(s: str) -> str:
    keep_white = bool(COLORED_BG.search(s.replace("hover:bg", "")))
    for pat, rep in REPLACEMENTS:
        s = re.sub(r"(?<![\w-])" + pat + r"(?![\w-])", rep, s)
    if not keep_white:
        s = re.sub(r"(?<![\w:-])text-white(?![\w/-])", "text-foreground", s)
    return s


def convert(text: str) -> str:
    # Every "..." and `...` literal that looks like a class list.
    def repl(m):
        body = m.group(0)
        if not re.search(r"\b(bg|text|border|divide|placeholder)-", body):
            return body
        return fix_string(body)
    return re.sub(r'"[^"\n]*"|`[^`]*`', repl, text)


if __name__ == "__main__":
    for path in sys.argv[1:]:
        src = open(path, encoding="utf-8").read()
        out = convert(src)
        if out != src:
            open(path, "w", encoding="utf-8").write(out)
            print("converted", path)
