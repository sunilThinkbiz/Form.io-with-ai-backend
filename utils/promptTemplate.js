function generatePrompt(prompt, existingSchema, component, title, mode) {
const key = component?.key?.toLowerCase() || "";
  const label = component?.label?.toLowerCase() || "";
  const isDescriptionField =
    mode === "autogenerate" ||
    label.includes("autogenerate") ||
    key.includes("autogenerate") ||
    /explain|describe/i.test(prompt);
  // Detect description field OR "explain/describe" type prompts
 if (isDescriptionField) {
    return `
-You are a professional technical writer for form field descriptions.
You are writing a ${component?.label || "field description"}.
Given the title: "${title}"
User prompt: "${prompt}"
Write a clear description suitable for a form field textarea.

Rules:
- Output ONLY plain text (no JSON, HTML, markdown, or code).
- Use clear, professional language.
- Never output raw JSON inside a textfield or textarea.
- No bullet points unless absolutely necessary.
- No extra commentary outside the description.
- Focus only on explaining the title in detail.
`;
  }

  // Default Form.io schema modification prompt
  return `
You are a professional Form.io form schema generator.

Input:
1. A user's change request (e.g., "rename 'test field' to 'first name'")
2. The current JSON schema in Form.io format
- If extra fields are provided in the prompt or previously unmatched fields are confirmed, place them exactly where the user requested in the new schema.
- Do NOT append them at the end unless the user explicitly says "add at the end".
If user says "show fields when checkbox is checked", add conditional logic:
"conditional": { "show": true, "when": "<checkbox-key>", "eq": "true" }

Your task:
- Modify or add fields based on the user request and any additional instructions.
-change the field position based on the user requrest (move above the mentioned field or move below the mentioned field)
- If extra fields are provided in the prompt (e.g., unmatched fields), place them in the correct logical order based on user instructions.
- Modify only what's needed based on the user request.
- NEVER create a new component if the change only requires modifying an existing one.
- If a field with a given label exists, and the request is to change it, update that exact component's "label" property.
- NEVER duplicate or add fields with the same "key".
- Return ONLY a single, valid JSON (no markdown, no explanation).

User Prompt:
"${prompt}"

Current Form Schema:
${JSON.stringify(existingSchema)}

Rules:
- Modify existing fields if prompt mentions changing labels, placeholders, etc.
- Don't duplicate components.
- Keep keys the same unless the prompt says to change them.
- Ensure valid Form.io structure.

Additional Capabilities:
- If the user requests field reordering (e.g., "move email to top"), reorder the components accordingly.
- Reorder the form fields based on the user's request.
- The user may ask to move a field to the top, bottom, or place it above/below another field.
- Maintain the structure and existing data.
- Do not ask again for unmatched fields when reordering — just reorder as requested.

- If the prompt suggests layout changes, use appropriate Form.io containers like:
  - "columns" for side-by-side layout
  - "panel" or "fieldset" for grouping fields
- Preserve the rest of the form structure unless a change is explicitly requested.
`;
}

module.exports = generatePrompt;
