import { SseParser } from './sse-parser';

describe('SseParser', () => {
  it('rend un message complet avec son type et son identifiant', () => {
    const parser = new SseParser();

    expect(parser.feed('event: alarm\nid: urn:uuid:1\ndata: {"id":4}\n\n')).toEqual([
      { event: 'alarm', id: 'urn:uuid:1', data: '{"id":4}' },
    ]);
  });

  it('attend la fin d’un message coupé par le réseau', () => {
    const parser = new SseParser();

    expect(parser.feed('event: mission\ndata: {"id"')).toEqual([]);
    expect(parser.feed(':7}\n')).toEqual([]);
    expect(parser.feed('\nevent: equip')).toEqual([
      { event: 'mission', id: null, data: '{"id":7}' },
    ]);
    expect(parser.feed('ment\ndata: {}\n\n')).toEqual([
      { event: 'equipment', id: null, data: '{}' },
    ]);
  });

  it('rend plusieurs messages reçus d’un coup', () => {
    const parser = new SseParser();

    const messages = parser.feed('data: a\n\ndata: b\r\n\r\ndata: c\n\n');

    expect(messages.map((message) => message.data)).toEqual(['a', 'b', 'c']);
    expect(messages[0].event).toBe('message');
  });

  it('assemble les données sur plusieurs lignes', () => {
    expect(new SseParser().feed('data: ligne 1\ndata: ligne 2\n\n')[0].data).toBe(
      'ligne 1\nligne 2',
    );
  });

  it('ignore les commentaires et les blocs sans données', () => {
    expect(new SseParser().feed(':\n\n: battement\n\nevent: alarm\n\n')).toEqual([]);
  });
});
