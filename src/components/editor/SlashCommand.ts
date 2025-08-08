import { Extension } from '@tiptap/core';
import suggestion, { SuggestionOptions } from '@tiptap/suggestion';

type SlashItem = { label: string; action: 'todo' | 'quote' | 'insight' | 'trade' };

export interface SlashCommandOptions {
  onInsight?: (text: string) => void;
  onTradeLink?: (href: string) => void;
}

export const SlashCommand = (opts: SlashCommandOptions = {}) =>
  Extension.create({
    name: 'slash-command',
    addProseMirrorPlugins() {
      const items = (query: string): SlashItem[] => {
        const base: SlashItem[] = [
          { label: 'Todo List', action: 'todo' },
          { label: 'Quote', action: 'quote' },
          { label: 'Insight Block', action: 'insight' },
          { label: 'Link to Trade', action: 'trade' },
        ];
        return base.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
      };

      let menuEl: HTMLDivElement | null = null;
      let lastProps: any = null;

      const render: SuggestionOptions<SlashItem>['render'] = () => ({
        onStart: (props) => {
          lastProps = props;
          menuEl = document.createElement('div');
          menuEl.className = 'rounded-lg border border-border bg-popover text-popover-foreground text-sm shadow p-1 z-50';
          document.body.appendChild(menuEl);
          (this as any).onUpdate?.(props);
        },
        onUpdate: (props) => {
          lastProps = props;
          if (!menuEl || !props.clientRect) return;
          const rect = props.clientRect();
          menuEl.style.position = 'absolute';
          menuEl.style.left = rect.left + 'px';
          menuEl.style.top = rect.bottom + 6 + 'px';
          menuEl.innerHTML = props.items
            .map((i) => `<div data-action="${i.action}" class="px-2 py-1 hover:bg-muted cursor-pointer rounded">${i.label}</div>`) 
            .join('');
          Array.from(menuEl.querySelectorAll('[data-action]')).forEach((n) => {
            n.addEventListener('mousedown', (e) => {
              e.preventDefault();
              const action = (e.currentTarget as HTMLElement).dataset.action as SlashItem['action'];
              const item = (props.items as SlashItem[]).find((it) => it.action === action);
              if (!item) return;
              props.command({ editor: props.editor, range: props.range, item });
            });
          });
        },
        onExit: () => {
          if (menuEl?.parentNode) menuEl.parentNode.removeChild(menuEl);
          menuEl = null;
          lastProps = null;
        },
      });

      return [
        suggestion<SlashItem>({
          editor: this.editor,
          char: '/',
          allowSpaces: true,
          items: ({ query }) => items(query),
          command: ({ editor, range, item }) => {
            editor.chain().focus().deleteRange(range).run();
            switch (item.action) {
              case 'todo':
                editor.chain().focus().toggleTaskList().run();
                break;
              case 'quote':
                editor.chain().focus().toggleBlockquote().run();
                break;
              case 'insight': {
                const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to).trim();
                if (sel) opts.onInsight?.(sel);
                break;
              }
              case 'trade': {
                const href = window.prompt('Trade ID (e.g. #trade:abc123) or URL:');
                if (href) opts.onTradeLink?.(href);
                break;
              }
            }
          },
          render,
        }) as any,
      ];
    },
  });

export default SlashCommand;


