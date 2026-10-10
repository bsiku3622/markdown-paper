import { Extension, textInputRule } from '@tiptap/core';

export const PaperTypography = Extension.create({
  name: 'paperTypography',
  addInputRules() {
    return [
      // -- becomes an em dash before the final > in --> is typed.
      textInputRule({ find: /(?:-->|->|—>)$/, replace: '→' }),
      textInputRule({ find: /(?:==>|=>)$/, replace: '⇒' }),
      textInputRule({ find: /--$/, replace: '—' }),
    ];
  },
});
