import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { Alarm } from '../alarm/alarm.models';
import { Equipment } from '../equipment/equipment.models';
import { Mission } from '../mission/mission.models';
import { SseParser } from './sse-parser';

export type RealtimeStatus = 'offline' | 'connecting' | 'live';

export type RealtimeEvent =
  | { readonly type: 'equipment'; readonly data: Equipment }
  | { readonly type: 'mission'; readonly data: Mission }
  | { readonly type: 'alarm'; readonly data: Alarm };

interface RealtimeToken {
  readonly token: string;
  readonly topics: readonly string[];
}

const HUB_URL = '/.well-known/mercure';
const MAX_RETRY_DELAY_MS = 30_000;
const EVENT_TYPES: ReadonlySet<string> = new Set(['equipment', 'mission', 'alarm']);

/**
 * Lit le flux Mercure. Le hub n'accepte que des abonnés munis d'un jeton délivré par l'API ;
 * `EventSource` ne sait pas envoyer d'en-tête Authorization, d'où la lecture du flux avec `fetch`.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeClient {
  private readonly http = inject(HttpClient);
  private readonly events = new Subject<RealtimeEvent>();
  private readonly statusSignal = signal<RealtimeStatus>('offline');
  private controller: AbortController | null = null;

  readonly events$: Observable<RealtimeEvent> = this.events.asObservable();
  readonly status = this.statusSignal.asReadonly();

  start(): void {
    if (this.controller) {
      return;
    }
    this.controller = new AbortController();
    void this.run(this.controller.signal);
  }

  stop(): void {
    this.controller?.abort();
    this.controller = null;
    this.statusSignal.set('offline');
  }

  /** Se reconnecte indéfiniment, avec un délai qui double jusqu'à 30 s. */
  private async run(abort: AbortSignal): Promise<void> {
    for (let attempt = 0; !abort.aborted; attempt++) {
      this.statusSignal.set('connecting');
      try {
        await this.listen(abort, () => {
          attempt = 0;
          this.statusSignal.set('live');
        });
      } catch {
        // Hub injoignable, jeton refusé ou flux coupé : on réessaie plus bas.
      }
      if (abort.aborted) {
        return;
      }
      this.statusSignal.set('connecting');
      await wait(Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** attempt), abort);
    }
  }

  private async listen(abort: AbortSignal, onOpen: () => void): Promise<void> {
    // Un jeton neuf à chaque connexion : il n'expire jamais en cours de reconnexion.
    const { token, topics } = await firstValueFrom(
      this.http.get<RealtimeToken>('/api/realtime/token'),
    );
    // Protocole Mercure 1.0 : `match` désigne un sujet exact (l'ancien paramètre `topic` est refusé).
    const query = topics.map((topic) => `match=${encodeURIComponent(topic)}`).join('&');
    const response = await fetch(`${HUB_URL}?${query}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      signal: abort,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Hub Mercure : réponse ${response.status}`);
    }
    onOpen();

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    const parser = new SseParser();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        return;
      }
      for (const message of parser.feed(value)) {
        this.dispatch(message.event, message.data);
      }
    }
  }

  private dispatch(type: string, data: string): void {
    if (!EVENT_TYPES.has(type)) {
      return;
    }
    try {
      this.events.next({ type, data: JSON.parse(data) } as RealtimeEvent);
    } catch {
      // Message illisible : on l'ignore plutôt que d'interrompre le flux.
    }
  }
}

function wait(ms: number, abort: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    abort.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
