const major = Number(process.versions.node.split(".")[0]);

if (major !== 22) {
  process.stderr.write(
    [
      `Minty requires Node 22.x (detected ${process.versions.node}).`,
      "",
      "If you use nvm:",
      "  nvm use",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

