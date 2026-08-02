const MESSAGE_MARKER = "@@MESSAGE@@";
const CODE_MARKER = "@@CODE@@";

// The AI is asked to return raw "@@MESSAGE@@ ... @@CODE@@ <html>" text
// instead of JSON. Wrapping a large HTML/CSS/JS document inside a JSON
// string is fragile: any truncation or escaping slip breaks JSON.parse
// entirely. Plain markers can be parsed even when the response gets cut
// off mid-way, so we can tell the user "it got cut off" instead of a raw
// SyntaxError.
const extractCodeResponse = async (text) => {
  if (!text) return null;

  const codeIdx = text.indexOf(CODE_MARKER);
  if (codeIdx === -1) return null;

  const messageIdx = text.indexOf(MESSAGE_MARKER);
  const message =
    messageIdx !== -1
      ? text.slice(messageIdx + MESSAGE_MARKER.length, codeIdx).trim()
      : "Website generated";

  const code = text.slice(codeIdx + CODE_MARKER.length).trim();
  if (!code) return null;

  const complete = /<\/html>\s*$/i.test(code);

  return { message, code, complete };
};

export default extractCodeResponse;
