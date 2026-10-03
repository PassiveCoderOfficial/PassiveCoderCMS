"""Zip wordpress-plugin/passive-coder-migration into public/downloads for the
Import / Export page's download button. Run after editing the plugin."""
import os, zipfile
root = os.path.join(os.path.dirname(__file__), "..")
src = os.path.join(root, "wordpress-plugin", "passive-coder-migration")
out_dir = os.path.join(root, "public", "downloads")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "passive-coder-migration.zip")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, files in os.walk(src):
        for f in sorted(files):
            full = os.path.join(dirpath, f)
            z.write(full, os.path.join("passive-coder-migration", os.path.relpath(full, src)).replace(os.sep, "/"))
print("wrote", out, os.path.getsize(out), "bytes")
