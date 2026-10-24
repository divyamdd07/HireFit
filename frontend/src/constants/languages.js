export const LANGUAGES = [
  {
    id: "javascript",
    label: "JavaScript (Node.js)",
    monaco: "javascript",
    starter: [
      "// Input stdin se padho, output console.log se do",
      'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");',
      "",
      "// Write your solution here",
      "",
    ].join("\n"),
  },
  {
  id: "python",
  label: "Python 3",
  monaco: "python",
  starter: "# stdin se padho\nimport sys\ndata = sys.stdin.read().split()\n"
}
];