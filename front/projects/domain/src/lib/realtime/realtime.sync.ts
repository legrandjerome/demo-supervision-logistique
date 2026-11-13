import { effect, Injectable, inject, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivityStore } from '../activity/activity.store';
import { AlarmStore } from '../alarm/alarm.store';
import { EquipmentStore } from '../equipment/equipment.store';
import { LiveMissionStore } from '../mission/live-mission.store';
import { MissionStore } from '../mission/mission.store';
import { RealtimeClient, RealtimeEvent } from './realtime.client';

/**
 * Relie le flux temps réel aux stores : le seul endroit qui sait quel événement nourrit quel store.
 * Les composants ne connaissent que les stores, jamais le flux.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeSync {
  private readonly client = inject(RealtimeClient);
  private readonly equipments = inject(EquipmentStore);
  private readonly alarms = inject(AlarmStore);
  private readonly missions = inject(MissionStore);
  private readonly liveMissions = inject(LiveMissionStore);
  private readonly activity = inject(ActivityStore);
  private subscription: Subscription | null = null;

  constructor() {
    // À chaque (re)connexion, les stores sont rechargés : les événements émis pendant
    // la coupure ne sont pas rejoués, l'état est donc relu en entier.
    effect(() => {
      if (this.client.status() === 'live' && this.subscription) {
        untracked(() => this.resync());
      }
    });
  }

  start(): void {
    if (this.subscription) {
      return;
    }
    this.subscription = this.client.events$.subscribe((event) => this.apply(event));
    this.client.start();
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.client.stop();
  }

  private apply(event: RealtimeEvent): void {
    switch (event.type) {
      case 'equipment':
        this.equipments.applyRemote(event.data);
        break;
      case 'alarm':
        this.alarms.applyRemote(event.data);
        break;
      case 'mission':
        this.missions.applyRemote(event.data);
        this.liveMissions.applyRemote(event.data);
        this.activity.refreshSoon();
        break;
    }
  }

  private resync(): void {
    void this.equipments.load();
    void this.alarms.load();
    void this.liveMissions.load();
    this.activity.load();
  }
}
