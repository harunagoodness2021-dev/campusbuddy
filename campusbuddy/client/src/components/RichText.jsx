// Tiny, safe renderer for chat replies: "- " bullet lines and **bold**. React escapes everything else.
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function RichText({ text }) {
  const blocks = [];
  let list = null;

  text.split('\n').forEach((line, i) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: 'ul', items: list, key: i });
      }
      list.push(bullet[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ type: 'p', text: line, key: i });
    }
  });

  return blocks.map((b) =>
    b.type === 'ul' ? (
      <ul key={b.key} className="my-1.5 list-disc space-y-0.5 pl-5">
        {b.items.map((item, j) => (
          <li key={j}>{inline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={b.key} className="my-1">
        {inline(b.text)}
      </p>
    )
  );
}
