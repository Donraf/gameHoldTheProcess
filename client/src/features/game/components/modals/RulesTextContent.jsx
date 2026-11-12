import React, { useMemo } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const IMAGE_LINE_RE = /^!\[(.*?)\]\((.*?)\)\s*$/;
const TABLE_LINE_RE = /\|/;
const HTML_TABLE_RE = /<table[\s\S]*?<\/table>/gi;

const ALLOWED_TABLE_TAGS = new Set(["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "CAPTION"]);
const ALLOWED_CLASSES = new Set(["score-positive", "score-negative", "rules-table-title", "rules-row-label"]);
const ALLOWED_ATTRS = new Set(["colspan", "rowspan", "class"]);

const rulesHtmlTableSx = {
  width: "100%",
  borderCollapse: "collapse",
  my: 2,
  fontSize: 14,
  "& th, & td": {
    border: "2px solid #bdbdbd",
    padding: "10px 12px",
    textAlign: "center",
    verticalAlign: "middle",
  },
  "& .rules-table-title": {
    backgroundColor: "#fff59d",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  "& .rules-row-label": {
    textAlign: "left",
    fontWeight: "normal",
  },
  "& .score-positive": {
    color: "#c62828",
    fontWeight: "bold",
  },
  "& .score-negative": {
    color: "#1565c0",
    fontWeight: "bold",
  },
};

function parseTableRow(line) {
  const cells = line.split("|").map((cell) => cell.trim());
  if (cells[0] === "") {
    cells.shift();
  }
  if (cells[cells.length - 1] === "") {
    cells.pop();
  }
  return cells;
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function sanitizeHtmlTable(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.body.querySelector("table");
  if (!table) {
    return "";
  }

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.remove();
      return;
    }

    if (!ALLOWED_TABLE_TAGS.has(node.tagName)) {
      const parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      return;
    }

    [...node.attributes].forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      if (attrName === "class") {
        const classes = attr.value
          .split(/\s+/)
          .filter((className) => ALLOWED_CLASSES.has(className));
        if (classes.length > 0) {
          node.setAttribute("class", classes.join(" "));
        } else {
          node.removeAttribute("class");
        }
        return;
      }

      if (!ALLOWED_ATTRS.has(attrName)) {
        node.removeAttribute(attr.name);
      }
    });

    [...node.childNodes].forEach(sanitizeNode);
  };

  sanitizeNode(table);

  table.querySelectorAll("td, th").forEach((cell) => {
    if (cell.className) {
      return;
    }
    const value = cell.textContent.trim();
    if (/^\+/.test(value)) {
      cell.className = "score-positive";
    } else if (/^-/.test(value)) {
      cell.className = "score-negative";
    }
  });

  return table.outerHTML;
}

function parsePlainBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      index += 1;
      continue;
    }

    const imageMatch = trimmed.match(IMAGE_LINE_RE);
    if (imageMatch) {
      blocks.push({ type: "image", alt: imageMatch[1], src: imageMatch[2] });
      index += 1;
      continue;
    }

    if (TABLE_LINE_RE.test(line)) {
      const tableLines = [];
      while (index < lines.length && TABLE_LINE_RE.test(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();
      if (
        currentTrimmed === "" ||
        TABLE_LINE_RE.test(current) ||
        IMAGE_LINE_RE.test(currentTrimmed) ||
        /<table/i.test(current)
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
    }
  }

  return blocks;
}

function parseRulesBlocks(text) {
  const blocks = [];
  let lastIndex = 0;
  let match;

  HTML_TABLE_RE.lastIndex = 0;
  while ((match = HTML_TABLE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push(...parsePlainBlocks(text.slice(lastIndex, match.index)));
    }
    blocks.push({ type: "html-table", html: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push(...parsePlainBlocks(text.slice(lastIndex)));
  }

  return blocks;
}

function RulesMarkdownTable({ lines }) {
  const rows = lines.map(parseTableRow).filter((cells) => !isSeparatorRow(cells));
  if (rows.length === 0) {
    return null;
  }

  const [header, ...body] = rows;

  return (
    <TableContainer sx={{ my: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {header.map((cell, cellIndex) => (
              <TableCell key={`header-${cellIndex}`}>{cell}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {body.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`cell-${rowIndex}-${cellIndex}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function RulesHtmlTable({ html }) {
  const sanitizedHtml = useMemo(() => sanitizeHtmlTable(html), [html]);
  if (!sanitizedHtml) {
    return null;
  }

  return <Box sx={rulesHtmlTableSx} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}

export default function RulesTextContent({ text }) {
  const blocks = useMemo(() => parseRulesBlocks(text), [text]);

  return (
    <Box>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Typography key={`paragraph-${index}`} sx={{ whiteSpace: "pre-line", mb: 2 }}>
              {block.text}
            </Typography>
          );
        }

        if (block.type === "image") {
          return (
            <Box
              key={`image-${index}`}
              component="img"
              src={block.src}
              alt={block.alt}
              sx={{ maxWidth: "100%", my: 2 }}
            />
          );
        }

        if (block.type === "html-table") {
          return <RulesHtmlTable key={`html-table-${index}`} html={block.html} />;
        }

        return <RulesMarkdownTable key={`table-${index}`} lines={block.lines} />;
      })}
    </Box>
  );
}
