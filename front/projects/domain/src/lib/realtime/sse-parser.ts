export interface SseMessage {
  /** Champ `event:` du message ; « message » par défaut, comme dans la spécification. */
  readonly event: string;
  readonly data: string;
  readonly id: string | null;
}

/**
 * Analyseur de flux Server-Sent Events. Le réseau découpe le flux n'importe où :
 * l'analyseur garde le fragment incomplet et ne rend que les messages terminés.
 */
export class SseParser {
  private buffer = '';

  feed(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const blocks = this.buffer.split(/\r\n\r\n|\n\n|\r\r/);
    this.buffer = blocks.pop() ?? '';

    return blocks.map(parseBlock).filter((message): message is SseMessage => message !== null);
  }
}

function parseBlock(block: string): SseMessage | null {
  let event = 'message';
  let id: string | null = null;
  const data: string[] = [];

  for (const line of block.split(/\r\n|\n|\r/)) {
    if (line === '' || line.startsWith(':')) {
      continue; // ligne vide ou commentaire (battement de cœur du hub)
    }
    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    const value = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '');

    if (field === 'event') {
      event = value;
    } else if (field === 'data') {
      data.push(value);
    } else if (field === 'id') {
      id = value;
    }
  }

  return data.length ? { event, data: data.join('\n'), id } : null;
}
